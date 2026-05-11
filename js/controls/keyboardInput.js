export function mapKeyboardEventToAction(event) {
  if (event.key === 'ArrowUp') {
    return { action: 'up', source: 'keyboard' };
  }
  if (event.key === 'ArrowDown') {
    return { action: 'down', source: 'keyboard' };
  }
  if (event.key === 'ArrowLeft') {
    return { action: 'left', source: 'keyboard' };
  }
  if (event.key === 'ArrowRight') {
    return { action: 'right', source: 'keyboard' };
  }
  if (event.key === 'Enter') {
    return { action: 'select', source: 'keyboard' };
  }
  if (event.key === 'Backspace' || event.key === 'Escape') {
    return { action: 'back', source: 'keyboard' };
  }
  if (/^[0-9]$/.test(event.key)) {
    return { action: 'digit', value: event.key, isNumber: true, source: 'keyboard' };
  }

  return null;
}
