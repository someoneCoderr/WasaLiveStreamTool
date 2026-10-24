// Local replacement for the shipped Kc penalty controls. Symbols F, _, z, Is,
// P, B, Gc and Uc are supplied by the existing application bundle.
function Kc({side: team, name, scoreboard, add}) {
  const remaining = Gc(scoreboard).penalties[team];
  const limits = scoreboard.penaltyLimits?.[team] || [0, 0];
  const [drafts, setDrafts] = (0, _.useState)([null, null]);
  const [errors, setErrors] = (0, _.useState)(['', '']);
  const [busy, setBusy] = (0, _.useState)([false, false]);
  const update = (setter, slot, value) => setter(old => old.map((v, i) => i === slot ? value : v));
  const red = {backgroundColor: '#CD1619', borderColor: '#CD1619', color: '#FFFFFF'};
  async function save(slot, seconds) {
    update(setBusy, slot, true);
    try {
      if (await B('scoreboard/penalty', {team, slot: slot + 1, seconds})) {
        update(setDrafts, slot, null);
        update(setErrors, slot, '');
      }
    } finally {
      update(setBusy, slot, false);
    }
  }
  return (0, F.jsxs)('div', {
    className: 'flex flex-col gap-2 rounded-md bg-card p-3',
    children: [
      (0, F.jsx)('span', {className: 'truncate text-sm font-semibold', children: `Strafen ${name}`}),
      (0, F.jsx)('div', {
        className: 'grid grid-cols-2 gap-1.5',
        children: remaining.map((seconds, index) => {
          const maximum = (limits[index] || 0) / 1000;
          const active = seconds > 0 || maximum > 0;
          const value = drafts[index] === null ? (active ? Uc(seconds) : '') : drafts[index];
          const match = value.trim().match(/^(\d{1,2}):([0-5]\d)$/);
          const parsed = match ? Number(match[1]) * 60 + Number(match[2]) : null;
          const valid = parsed !== null && parsed <= maximum;
          const help = !match ? 'Bitte M:SS eingeben, z. B. 1:30.' : parsed > maximum ? `Maximal ${Uc(maximum)} erlaubt.` : '';
          return (0, F.jsxs)('div', {
            className: 'flex flex-col gap-1.5 rounded-md border-2 p-2',
            style: active ? {borderColor: '#CD1619'} : undefined,
            children: [
              (0, F.jsx)('span', {className: 'text-xs font-semibold', children: `Strafe ${index + 1}`}),
              (0, F.jsx)('span', {className: 'text-sm font-black tabular-nums', style: active ? {color: '#CD1619'} : undefined, 'aria-label': `${name}, Strafe ${index + 1}: ${active ? Uc(seconds) : 'frei'}`, children: active ? Uc(seconds) : 'keine Strafe'}),
              active && (0, F.jsx)(Is, {
                value, inputMode: 'numeric', placeholder: '1:30', maxLength: 5,
                className: 'h-9 w-full border-2 text-sm tabular-nums',
                'aria-label': `${name}, Restzeit Strafe ${index + 1} (maximal ${Uc(maximum)})`,
                'aria-invalid': drafts[index] !== null && !valid,
                onChange: event => {update(setDrafts, index, event.target.value); update(setErrors, index, '');},
                onKeyDown: event => {if (event.key === 'Enter' && valid && !busy[index]) {event.preventDefault(); save(index, parsed);}}
              }),
              active && (0, F.jsx)(z, {variant: 'outline', className: 'h-9 px-1 text-xs', disabled: !valid || busy[index], onClick: () => save(index, parsed), children: 'ZEIT SETZEN'}),
              active && (0, F.jsx)(z, {variant: 'outline', className: 'h-9 px-1 text-xs', disabled: busy[index], onClick: () => save(index, maximum), children: `AUF ${Uc(maximum)}`}),
              active && (0, F.jsx)(z, {variant: 'ghost', className: 'h-8 px-1 text-xs', disabled: busy[index], 'aria-label': `${name}, Strafe ${index + 1} löschen`, onClick: () => save(index, 0), children: 'LÖSCHEN'}),
              drafts[index] !== null && help && (0, F.jsx)('span', {role: 'alert', className: 'text-xs', style: {color: '#CD1619'}, children: help}),
              errors[index] && (0, F.jsx)('span', {role: 'alert', children: errors[index]})
            ]
          }, index);
        })
      }),
      (0, F.jsx)('span', {className: 'text-xs text-muted-foreground', children: 'Restzeit separat setzen. Spielzeit-Korrekturen verändern die Strafen nicht; Start/Stopp läuft weiter mit der Spieluhr.'}),
      add && (0, F.jsx)('div', {
        className: 'grid auto-cols-fr grid-flow-col gap-1.5',
        children: add.map(label => (0, F.jsx)(z, {
          variant: 'outline', className: P('h-9 px-0 text-xs', Bc, 'bg-background'),
          style: label === "2'" ? red : undefined,
          'aria-label': `${name}: Strafe ${label} auf die Matchuhr`,
          onClick: () => B('scoreboard/addPenalty', {team, label}), children: label
        }, label))
      })
    ]
  });
}
