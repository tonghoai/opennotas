export default defineEventHandler(() => {
  const config = useRuntimeConfig();
  return {
    version: config.public.version,
    buildId: config.public.buildId,
  };
});
