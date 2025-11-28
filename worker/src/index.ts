/**
 * OpenNotas Image Proxy Worker
 * 
 * A Cloudflare Worker that proxies image uploads to S3-compatible storage.
 * This worker acts as a CORS bypass proxy - it receives S3 credentials from
 * the client and forwards requests to the user's own S3-compatible storage.
 * 
 * The worker is stateless and does not store any credentials.
 */

interface S3Config {
  endpoint: string;
  accessKey: string;
  secretKey: string;
  bucket: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
};

async function hmacSHA256(key: ArrayBuffer, message: string): Promise<ArrayBuffer> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  return crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(message));
}

function bufferToHex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)]
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

async function signRequest(
  method: string,
  url: URL,
  headers: Record<string, string>,
  body: ArrayBuffer | null,
  accessKey: string,
  secretKey: string,
  region: string = 'auto',
  service: string = 's3'
): Promise<Record<string, string>> {
  const datetime = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '');
  const date = datetime.slice(0, 8);
  
  const signedHeaders = Object.keys(headers)
    .map(k => k.toLowerCase())
    .sort()
    .join(';');
  
  const canonicalHeaders = Object.entries(headers)
    .map(([k, v]) => `${k.toLowerCase()}:${v.trim()}`)
    .sort()
    .join('\n') + '\n';
  
  const payloadHash = body 
    ? bufferToHex(await crypto.subtle.digest('SHA-256', body))
    : 'UNSIGNED-PAYLOAD';
  
  const canonicalRequest = [
    method,
    url.pathname,
    url.search.slice(1),
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join('\n');
  
  const canonicalRequestHash = bufferToHex(
    await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonicalRequest))
  );
  
  const credentialScope = `${date}/${region}/${service}/aws4_request`;
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    datetime,
    credentialScope,
    canonicalRequestHash,
  ].join('\n');
  
  const kDate = await hmacSHA256(
    // new TextEncoder().encode('AWS4' + secretKey),
    new TextEncoder().encode('AWS4' + secretKey).buffer,
    date
  );
  const kRegion = await hmacSHA256(kDate, region);
  const kService = await hmacSHA256(kRegion, service);
  const kSigning = await hmacSHA256(kService, 'aws4_request');
  const signature = bufferToHex(await hmacSHA256(kSigning, stringToSign));
  
  const authorization = `AWS4-HMAC-SHA256 Credential=${accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  
  return {
    ...headers,
    'x-amz-date': datetime,
    'x-amz-content-sha256': payloadHash,
    'Authorization': authorization,
  };
}

function validateS3Config(s3Config: any): s3Config is S3Config {
  return (
    s3Config &&
    typeof s3Config.endpoint === 'string' && s3Config.endpoint.length > 0 &&
    typeof s3Config.accessKey === 'string' && s3Config.accessKey.length > 0 &&
    typeof s3Config.secretKey === 'string' && s3Config.secretKey.length > 0 &&
    typeof s3Config.bucket === 'string' && s3Config.bucket.length > 0
  );
}

async function handleUpload(request: Request): Promise<Response> {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const imageId = formData.get('imageId') as string | null;
    const s3ConfigStr = formData.get('s3Config') as string | null;
    
    if (!file || !imageId) {
      return new Response(JSON.stringify({ error: 'Missing file or imageId' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!s3ConfigStr) {
      return new Response(JSON.stringify({ error: 'Missing S3 configuration' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let s3Config: S3Config;
    try {
      s3Config = JSON.parse(s3ConfigStr);
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid S3 configuration format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!validateS3Config(s3Config)) {
      return new Response(JSON.stringify({ error: 'Incomplete S3 configuration' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return new Response(JSON.stringify({ error: 'Invalid file type' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const extension = file.name.split('.').pop() || 'jpg';
    const key = `images/${imageId}.${extension}`;
    
    const endpoint = s3Config.endpoint.replace(/\/$/, '');
    
    const s3Url = new URL(`${endpoint}/${s3Config.bucket}/${key}`);
    const fileBuffer = await file.arrayBuffer();
    
    const headers: Record<string, string> = {
      'Host': s3Url.host,
      'Content-Type': file.type,
      'Content-Length': fileBuffer.byteLength.toString(),
    };
    
    const signedHeaders = await signRequest(
      'PUT',
      s3Url,
      headers,
      fileBuffer,
      s3Config.accessKey,
      s3Config.secretKey
    );
    
    const s3Response = await fetch(s3Url.toString(), {
      method: 'PUT',
      headers: signedHeaders,
      body: fileBuffer,
    });
    
    if (!s3Response.ok) {
      const errorText = await s3Response.text();
      console.error('S3 upload error:', errorText);
      return new Response(JSON.stringify({ error: 'Failed to upload to storage', details: errorText }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const publicUrl = `${endpoint}/${s3Config.bucket}/${key}`;
    
    return new Response(JSON.stringify({ 
      success: true, 
      url: publicUrl,
      imageId,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Upload error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

async function handleGet(request: Request): Promise<Response> {
  try {
    const body = await request.json() as { imageUrl: string; s3Config: S3Config };
    const { imageUrl, s3Config } = body;

    if (!imageUrl) {
      return new Response(JSON.stringify({ error: 'Missing imageUrl' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!validateS3Config(s3Config)) {
      return new Response(JSON.stringify({ error: 'Invalid or incomplete S3 configuration' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const s3Url = new URL(imageUrl);
    
    const headers: Record<string, string> = {
      'Host': s3Url.host,
    };
    
    const signedHeaders = await signRequest(
      'GET',
      s3Url,
      headers,
      null,
      s3Config.accessKey,
      s3Config.secretKey
    );
    
    const s3Response = await fetch(s3Url.toString(), {
      method: 'GET',
      headers: signedHeaders,
    });
    
    if (!s3Response.ok) {
      return new Response(JSON.stringify({ error: 'Failed to fetch image from storage' }), {
        status: s3Response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const imageData = await s3Response.arrayBuffer();
    const contentType = s3Response.headers.get('Content-Type') || 'image/jpeg';
    
    return new Response(imageData, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
      },
    });
  } catch (error) {
    console.error('Get image error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

async function handleDelete(request: Request): Promise<Response> {
  try {
    const body = await request.json() as { imageId: string; s3Config: S3Config };
    const { imageId, s3Config } = body;

    if (!imageId) {
      return new Response(JSON.stringify({ error: 'Missing imageId' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!validateS3Config(s3Config)) {
      return new Response(JSON.stringify({ error: 'Invalid or incomplete S3 configuration' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const endpoint = s3Config.endpoint.replace(/\/$/, '');

    // We need to find the file first, but since we don't know the extension,
    // we'll try common extensions
    const extensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    let deleted = false;
    
    for (const ext of extensions) {
      const key = `images/${imageId}.${ext}`;
      const s3Url = new URL(`${endpoint}/${s3Config.bucket}/${key}`);
      
      const headers: Record<string, string> = {
        'Host': s3Url.host,
      };
      
      const signedHeaders = await signRequest(
        'DELETE',
        s3Url,
        headers,
        null,
        s3Config.accessKey,
        s3Config.secretKey
      );
      
      const s3Response = await fetch(s3Url.toString(), {
        method: 'DELETE',
        headers: signedHeaders,
      });
      
      if (s3Response.ok || s3Response.status === 204) {
        deleted = true;
        break;
      }
    }
    
    return new Response(JSON.stringify({ 
      success: true, 
      deleted,
      imageId,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Delete error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }
    
    const url = new URL(request.url);
    const path = url.pathname;
    
    if (path === '/health') {
      return new Response(JSON.stringify({ status: 'ok' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    if (path === '/upload' && request.method === 'POST') {
      return handleUpload(request);
    }
    
    if (path === '/get' && request.method === 'POST') {
      return handleGet(request);
    }
    
    if (path === '/delete' && request.method === 'POST') {
      return handleDelete(request);
    }
    
    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  },
};
