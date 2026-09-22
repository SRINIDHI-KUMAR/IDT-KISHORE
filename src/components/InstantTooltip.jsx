import React, { useEffect } from 'react';

export default function InstantTooltip() {
  useEffect(() => {
    let tipEl = document.getElementById('instant-tooltip');
    if (!tipEl) {
      tipEl = document.createElement('div');
      tipEl.id = 'instant-tooltip';
      document.body.appendChild(tipEl);
    }

    let currentTarget = null;

    const updateTooltipPos = (e) => {
      if (!tipEl) return;
      const pad = 10;
      const x = e.clientX;
      const y = e.clientY;
      const w = tipEl.offsetWidth || 130;
      const h = tipEl.offsetHeight || 36;

      let posX = x;
      let posY = y - 10;

      if (posX - w / 2 < pad) posX = pad + w / 2;
      else if (posX + w / 2 > window.innerWidth - pad) posX = window.innerWidth - pad - w / 2;

      if (posY - h < pad) {
        posY = y + 24;
        tipEl.style.transform = 'translate(-50%, 0)';
      } else {
        tipEl.style.transform = 'translate(-50%, -100%)';
      }

      tipEl.style.left = `${posX}px`;
      tipEl.style.top = `${posY}px`;
    };

    const handleMouseOver = (e) => {
      const el = e.target.closest('[data-tip]');
      if (el) {
        currentTarget = el;
        const content = el.getAttribute('data-tip');
        if (content) {
          tipEl.innerHTML = content;
          tipEl.classList.add('show');
          updateTooltipPos(e);
        }
      }
    };

    const handleMouseMove = (e) => {
      if (currentTarget && tipEl.classList.contains('show')) {
        updateTooltipPos(e);
      }
    };

    const handleMouseOut = (e) => {
      const el = e.target.closest('[data-tip]');
      if (el && el === currentTarget) {
        currentTarget = null;
        tipEl.classList.remove('show');
      }
    };

    document.addEventListener('mouseover', handleMouseOver, { passive: true });
    document.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseout', handleMouseOut, { passive: true });

    return () => {
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseout', handleMouseOut);
    };
  }, []);

  return <div id="instant-tooltip" />;
}

