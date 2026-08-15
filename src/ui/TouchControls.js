/* src/ui/TouchControls.js — on-screen ◀ ▶ B A (+ START) for touch devices.
 * Sets TouchControls.bits, which GameScene ORs into the keyboard bits.
 * B = jump · A = run/chakra — matching the title-screen legend.
 */

import { BTN } from '../core/constants.js';

export const TouchControls = {
    bits: 0,
    mounted: false,

    mount(el, _app) {
        if (this.mounted || !el) return;
        const isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
        if (!isTouch) return;

        this.mounted = true;
        el.hidden = false;
        el.innerHTML = '';

        const base = {
            position: 'absolute',
            bottom: '18px',
            width: '58px',
            height: '58px',
            borderRadius: '50%',
            border: '2px solid rgba(242,182,50,0.55)',
            background: 'rgba(242,182,50,0.16)',
            color: '#f5e6c8',
            fontSize: '22px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            touchAction: 'none',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            pointerEvents: 'auto',
        };

        const make = (label, bit, style) => {
            const b = document.createElement('div');
            b.dataset.btn = label;
            b.textContent = label;
            Object.assign(b.style, base, style);
            el.appendChild(b);

            const down = (e) => { e.preventDefault(); this.bits |= bit; b.setPointerCapture?.(e.pointerId); };
            const up = (e) => { e.preventDefault(); this.bits &= ~bit; };
            b.addEventListener('pointerdown', down);
            b.addEventListener('pointerup', up);
            b.addEventListener('pointercancel', up);
            b.addEventListener('lostpointercapture', up);
        };

        make('◀', BTN.LEFT, { left: '4%' });
        make('▶', BTN.RIGHT, { left: '22%' });
        make('B', BTN.JUMP, { right: '22%' });
        make('A', BTN.RUN, { right: '4%' });

        /* START — synthesizes Enter so title/ending scenes respond as-is */
        const start = document.createElement('div');
        start.dataset.btn = 'START';
        start.textContent = 'START';
        Object.assign(start.style, base, {
            left: '50%',
            transform: 'translateX(-50%)',
            bottom: '10px',
            width: '84px',
            height: '30px',
            borderRadius: '15px',
            fontSize: '12px',
            letterSpacing: '0.15em',
            opacity: '0.85',
        });
        el.appendChild(start);
        start.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Enter' }));
        });
    },
};