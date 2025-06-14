function outsideClickMenu() {
  document.addEventListener('click', () => {
    const menuFolder: any = document.getElementById('menu-folder') || {};
    if (menuFolder.style.display === 'block') {
      menuFolder.style.display = 'none';
    }

    const menuNote: any = document.getElementById('menu-note') || {};
    if (menuNote.style.display === 'block') {
      menuNote.style.display = 'none';
    }
  });
}

function offsetMenuFolder(data: any) {
  const menuFolder: any = document.getElementById('menu-folder') || {};
  menuFolder.style.display = 'block';
  menuFolder.style.left = `${data.x}px`;
  menuFolder.style.top = `${data.y}px`;

  // if data.y is near bottom, then push y up 150px
  if (window.innerHeight - data.y < 200) {
    menuFolder.style.top = `${data.y - 150}px`;
  }
}

function offsetMenuNote(data: any) {
  const menuNote: any = document.getElementById('menu-note') || {};
  menuNote.style.display = 'block';
  menuNote.style.left = `${data.x}px`;
  menuNote.style.top = `${data.y}px`;

  // if data.y is near bottom, then push y up 150px
  if (window.innerHeight - data.y < 200) {
    menuNote.style.top = `${data.y - 150}px`;
  }
}

function hideMenuFolder() {
  const menuFolder: any = document.getElementById('menu-folder') || {};
  menuFolder.style.display = 'none';
}

function hideMenuNote() {
  const menuNote: any = document.getElementById('menu-note') || {};
  menuNote.style.display = 'none';
}

export {
  outsideClickMenu,
  offsetMenuFolder,
  offsetMenuNote,
  hideMenuFolder,
  hideMenuNote,
};
