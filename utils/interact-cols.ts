function handleInteractCols(
  isMobile: boolean,
  navbarTopRef: any,
  colsFoldersWidth: Ref,
  colsNotesWidth: Ref,
  setColsWidthData: any,
) {
  setTimeout(() => {
    if (document.querySelector('.cols-notes')) {
      const mc = new (window as any).Hammer.Manager(document.querySelector('.cols-notes'));
      mc.add(new (window as any).Hammer.Swipe({ threshold: 10 }));
      mc.on("swipeleft swiperight", function (ev: any) {
        switch (ev.type) {
          case 'swipeleft':
            if (isMobile) {
              navbarTopRef.value?.openSettingDrawer();
            }
            break;
          case 'swiperight':
            if (isMobile) {
              navbarTopRef.value?.openHambugerDrawer();
            }
            break;
        }
      });
    }
  }, 300);

  setTimeout(() => {
    if (document.querySelector('.cols-folders')) {
      const colsFolders = document.querySelector('.cols-folders');
      (window as any).interact(colsFolders)
        .resizable({
          edges: {
            right: true,
          },
          listeners: {
            start: function () {
              colsFolders?.classList.remove('transition-all', 'duration-300');
            },
            move: function (event: any) {
              if (event.rect.width < 236 || event.rect.width > 300) {
                return;
              }

              event.target.style.width = event.rect.width + 'px';
              colsFoldersWidth.value = event.rect.width;
              setColsWidthData();
            },
            end: function () {
              colsFolders?.classList.add('transition-all', 'duration-300');
            }
          }
        })
    }
  }, 350);

  setTimeout(() => {
    if (document.querySelector('.cols-notes')) {
      const colsNotes = document.querySelector('.cols-notes');
      (window as any).interact(colsNotes)
        .resizable({
          edges: {
            right: '.right-menu',
          },
          listeners: {
            start: function () {
              colsNotes?.classList.remove('transition-all', 'duration-300');
            },
            move: function (event: any) {
              if (event.rect.width < 346 || event.rect.width > 500) {
                return;
              }

              event.target.style.width = event.rect.width + 'px';
              colsNotesWidth.value = event.rect.width;
              setColsWidthData();
            },
            end: function () {
              colsNotes?.classList.add('transition-all', 'duration-300');
            }
          }
        })
    }
  }, 350);
}

export { handleInteractCols };
