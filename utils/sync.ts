import LocalForageAdapter from "~/adapter/localforage";
import TursoAdapter from "~/adapter/turso";
import {
  createFolder,
  createNote,
  getFolderDetail,
  getNoteDetail,
  getPassword,
  setPassword,
  updateFolder,
  updateNote,
} from "~/services/main";

function selectAdapter(
  adapter: string = "LocalForage",
  configuration: any,
  onLine: boolean
) {
  switch (adapter) {
    case "LocalForage":
      return new LocalForageAdapter(configuration);
    case "Turso":
      if (!onLine) {
        throw new NetworkError("");
      }

      try {
        return new TursoAdapter(configuration);
      } catch (error) {
        throw new SyncError("");
      }
    default:
      throw new SyncError("");
  }
}

async function pullData(
  settings: any,
  privateKey: CryptoKey | undefined,
  lastPushData: number,
  lastPull: Ref<number>,
  idPulled: Ref<string[]>,
  actionObject: Ref<any>,
  isPasswordExist: Ref<boolean>
) {
  // if local then ignore
  if (settings?.sync?.adapter === "LocalForage") {
    return {
      ok: false,
    };
  }

  const syncAdapter: any = selectAdapter(
    settings?.sync?.adapter,
    settings?.sync?.configuration,
    window.navigator.onLine
  );
  const now = nowUnix();
  let lastDataAt = -Infinity;

  try {
    let pullFolders = await syncAdapter.pullFolders(lastPull.value);
    let pullNotes = await syncAdapter.pullNotes(lastPull.value);
    let pullSettings = await syncAdapter.pullSettings(lastPull.value);

    pullFolders = pullFolders.filter((folder: any) => {
      return folder.lastSync > lastPushData;
    });
    pullNotes = pullNotes.filter((note: any) => {
      return note.lastSync > lastPushData;
    });
    pullSettings = pullSettings?.lastSync > lastPushData ? pullSettings : {};

    idPulled.value = [
      ...pullFolders.map((folder: any) => folder.id),
      ...pullNotes.map((note: any) => note.id),
    ];

    if (pullFolders.length > 0) {
      for (const folder of pullFolders) {
        const isFolderExist = await getFolderDetail(folder.id);
        if (!isFolderExist.id) {
          await createFolder(folder);
        } else {
          await updateFolder(
            folder.id,
            folder.updatedAt > isFolderExist.updatedAt ? folder : isFolderExist
          );
        }

        if (lastDataAt < +folder.updatedAt) {
          lastDataAt = +folder.updatedAt;
        }
      }
    }

    if (pullNotes.length > 0) {
      for (const note of pullNotes) {
        const isNoteExist = await getNoteDetail(note.id);
        if (!isNoteExist.id) {
          note.content = await decryptDataAES(note.content, privateKey!);
          await createNote("", note);
        } else {
          note.content = await decryptDataAES(note.content, privateKey!);
          const newNoteData =
            note.updatedAt > isNoteExist.updatedAt ? note : isNoteExist;
          if (Object.keys(actionObject.value).includes(note.id)) {
            newNoteData.content = mergeDiff(isNoteExist.content, note.content);
            newNoteData.updatedAt = nowUnix();
          }
          await updateNote(note.id, newNoteData);
        }

        if (lastDataAt < +note.updatedAt) {
          lastDataAt = +note.updatedAt;
        }
      }
    }

    if (pullSettings) {
      if (pullSettings.password) {
        await setPassword(pullSettings.password);
        isPasswordExist.value = true;
      }

      if (lastDataAt < +pullSettings.updatedAt) {
        lastDataAt = +pullSettings.updatedAt;
      }
    }

    if (lastDataAt !== -Infinity) {
      lastPull.value = lastDataAt;
    }

    setTimeout(() => {
      idPulled.value = [];
    }, 1000);

    if (lastDataAt !== -Infinity) {
      return {
        ok: true,
        now,
      };
    } else {
      return {
        ok: false,
        now,
      };
    }
  } catch (error) {
    throw error;
  }
}

async function pushData(
  settings: any,
  privateKey: CryptoKey | undefined,
  actionObject: Ref<any>,
  lastPushData: Ref<number>,
  now: number
) {
  if (settings?.sync?.adapter === "LocalForage") {
    return;
  }

  const syncAdapter: any = selectAdapter(
    settings?.sync?.adapter,
    settings?.sync?.configuration,
    window.navigator.onLine
  );

  for (const key of Object.keys(actionObject.value)) {
    const obj = actionObject.value[key];
    const id = key;
    switch (obj) {
      case "folder": {
        const folder = await getFolderDetail(id);
        await syncAdapter.pushFolder({
          ...folder,
          lastSync: now,
          updatedAt: folder.updatedAt,
        });
        break;
      }
      case "note": {
        const note = await getNoteDetail(id);
        await syncAdapter.pushNote({
          ...note,
          content: await encryptDataAES(note.content, privateKey!),
          lastSync: now,
          updatedAt: note.updatedAt,
        });
        break;
      }
      case "settings": {
        const password = await getPassword();
        await syncAdapter.pushSettings({
          password,
          id: "settings",
          lastSync: now,
          updatedAt: now,
        });
        break;
      }
    }

    lastPushData.value = now;
    delete actionObject.value[key];
  }
}

export { pullData, pushData };
