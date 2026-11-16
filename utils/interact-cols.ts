import { getGestureAxis, getGestureOwner } from './gesture';

function handleInteractCols(
  isMobile: boolean,
  navbarTopRef: any,
  colsFoldersWidth: Ref,
  colsNotesWidth: Ref,
  setColsWidthData: any,
) {
  setTimeout(() => {
    if (document.querySelector('.cols-notes')) {
      const mc = new (window as any).Hammer.Manager(document.querySelector('.cols-notes'), {
        touchAction: 'pan-y',
      });
      mc.add(new (window as any).Hammer.Swipe({ threshold: 10, direction: (window as any).Hammer.DIRECTION_HORIZONTAL }));
      mc.on("swipeleft swiperight", function (ev: any) {
        // Note rows own horizontal gestures; otherwise a note swipe would
        // also open the drawer when the same touch ends.
        const target = (ev.input?.target || ev.target) as HTMLElement | null;
        if (target?.closest?.('[data-note-id]')) return;
        if (getGestureOwner() === 'note-swipe') return;
        if (getGestureAxis() === 'vertical') return;

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
    if (isMobile) return;
    if (document.querySelector('.cols-folders')) {
      const colsFolders = document.querySelector('.cols-folders');
      (window as any).interact(colsFolders)
        .resizable({
          edges: {
            right: true,
            margin: 15
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
    if (isMobile) return;
    if (document.querySelector('.cols-notes')) {
      const colsNotes = document.querySelector('.cols-notes');
      (window as any).interact(colsNotes)
        .resizable({
          edges: {
            right: true,
            margin: 15
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
