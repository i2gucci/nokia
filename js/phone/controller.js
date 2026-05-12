export function createPhoneController() {
  const menuItems = ['Messages', 'Compose', 'Contacts', 'Snake', 'Settings'];

  const state = {
    view: 'home',
    menuIndex: 0,
    listIndex: 0,
    draftText: '',
    inbox: [
      { from: 'MOM', body: 'Dinner at 7. Dont be late.' },
      { from: 'ALEX', body: 'Meet at arcade after class?' }
    ],
    contacts: ['MOM', 'DAD', 'ALEX', 'JAMIE', 'WORK'],
    detailText: ''
  };

  function wrapIndex(index, length) {
    if (length <= 0) {
      return 0;
    }
    return (index + length) % length;
  }

  function openMenuItem() {
    const selected = menuItems[state.menuIndex];
    if (selected === 'Messages') {
      state.view = 'messages';
      state.listIndex = 0;
    }
    if (selected === 'Compose') {
      state.view = 'compose';
    }
    if (selected === 'Contacts') {
      state.view = 'contacts';
      state.listIndex = 0;
    }
    if (selected === 'Snake') {
      state.view = 'snake';
    }
    if (selected === 'Settings') {
      state.view = 'settings';
    }
  }

  function dispatch(action, value = '') {
    if (state.view === 'home') {
      if (action === 'select' || action === 'menu' || action === 'up' || action === 'down') {
        state.view = 'menu';
        state.menuIndex = action === 'up' ? menuItems.length - 1 : 0;
      }
      return;
    }

    if (state.view === 'menu') {
      if (action === 'up') {
        state.menuIndex = wrapIndex(state.menuIndex - 1, menuItems.length);
      }
      if (action === 'down') {
        state.menuIndex = wrapIndex(state.menuIndex + 1, menuItems.length);
      }
      if (action === 'select') {
        openMenuItem();
      }
      if (action === 'back') {
        state.view = 'home';
      }
      return;
    }

    if (state.view === 'messages') {
      if (action === 'up') {
        state.listIndex = wrapIndex(state.listIndex - 1, state.inbox.length);
      }
      if (action === 'down') {
        state.listIndex = wrapIndex(state.listIndex + 1, state.inbox.length);
      }
      if (action === 'select') {
        const msg = state.inbox[state.listIndex];
        state.detailText = `${msg.from}: ${msg.body}`;
        state.view = 'detail';
      }
      if (action === 'back') {
        state.view = 'menu';
      }
      return;
    }

    if (state.view === 'contacts') {
      if (action === 'up') {
        state.listIndex = wrapIndex(state.listIndex - 1, state.contacts.length);
      }
      if (action === 'down') {
        state.listIndex = wrapIndex(state.listIndex + 1, state.contacts.length);
      }
      if (action === 'select') {
        const name = state.contacts[state.listIndex];
        state.detailText = `Calling ${name}...`;
        state.view = 'detail';
      }
      if (action === 'back') {
        state.view = 'menu';
      }
      return;
    }

    if (state.view === 'compose') {
      if (action === 'digit') {
        state.draftText += value;
      }
      if (action === 'select' && state.draftText.trim()) {
        state.inbox.unshift({ from: 'SENT', body: state.draftText.trim() });
        state.draftText = '';
        state.view = 'messages';
        state.listIndex = 0;
      }
      if (action === 'back') {
        if (state.draftText.length > 0) {
          state.draftText = state.draftText.slice(0, -1);
        } else {
          state.view = 'menu';
        }
      }
      return;
    }

    if (state.view === 'detail') {
      if (action === 'back' || action === 'select') {
        state.view = 'menu';
      }
      return;
    }

    if (state.view === 'snake') {
      if (action === 'select') {
        state.view = 'snake_playing';
      }
      if (action === 'back') {
        state.view = 'menu';
      }
      return;
    }

    if (state.view === 'snake_playing') {
      if (action === 'back') {
        state.view = 'snake';
      }
      return;
    }

    if (state.view === 'settings') {
      if (action === 'back') {
        state.view = 'menu';
      }
    }
  }

  function resetToHome() {
    state.view = 'home';
  }

  function getState() {
    return state;
  }

  function getMenuItems() {
    return menuItems;
  }

  return {
    dispatch,
    getState,
    getMenuItems,
    resetToHome
  };
}
