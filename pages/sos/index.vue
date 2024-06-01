<script lang="ts" setup>
import {
    getAllNotes,
    getFolders,
    getPassword,
} from '../../services/main';

const route = useRoute();
const { $i18n } = useNuxtApp();
const runtimeConfig = useRuntimeConfig();

onMounted(async () => {
    const localPassword = await getPassword();
    const data = {
        password: route.query.pw,
    };

    if (localPassword && !data.password) {
        const userPassword = prompt("Please enter your password");
        data.password = userPassword;
    }

    return handleExportNotesConfirm(data);
});

const handleExportNotesConfirm = async (data: any) => {
    const password = await getPassword();
    const newHashPassword = await hashPassword(data.password);

    return handleExportNotes(!password ? true : password === newHashPassword);
}

const handleExportNotes = async (includeLock: boolean) => {
    const notes = await getAllNotes();
    const folders = await getFolders($i18n.t('app.list_folder_all'));
    const foldersObject = folders.reduce((acc: any, folder: any) => {
        acc[folder.id] = folder.name;
        return acc;
    }, {});

    const notesFiltered = notes.filter((note: any) => !note.deleteCompletelyAt);
    const notesReformated = [];

    for (const note of notesFiltered) {
        if (!includeLock && note.isLocked) {
            continue;
        }

        const password = await getPassword();
        const folderName = note.folderId ? foldersObject[note.folderId] : "";
        notesReformated.push({
            folderName: folderName,
            content: note.isLocked ? await decryptData(note.content, password) : note.content,
            createdAt: note.createdAt,
            deletedAt: note.deletedAt,
        });
    }

    const dataExport = {
        data: notesReformated,
        metadata: {
            version: runtimeConfig.public.version,
            exportedAt: new Date().toISOString(),
        }
    };
    const data = JSON.stringify(dataExport, null, 2);
    saveJsonFile(data, 'opennotas-export-notes.json');
}
</script>
