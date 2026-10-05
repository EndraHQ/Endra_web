import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useModals } from '../context/ModalContext';
import { Modal } from '../components/feedback/Modal';
import { Button } from '../components/common/Button';
import { Icon } from '../components/icons/Icon';
import { Timeline } from '../components/media/Timeline';
import { hhmm } from '../utils/formatters';

export const ReportIncidentModal: React.FC = () => {
  const { devices, setEvents, setActFilter, go, toast } = useApp();
  const { modal, closeModal } = useModals();

  const isOpen = modal.type === 'reportIncident';
  const preCamIndex = modal.type === 'reportIncident' ? modal.preCamIndex : undefined;

  const liveCameras = devices.filter(d => d.k === 'camera');
  const [sev, setSev] = useState<'low' | 'med' | 'high'>('med');
  const [camIndex, setCamIndex] = useState<number>(preCamIndex ?? 0);
  const [desc, setDesc] = useState<string>('');

  if (!isOpen) return null;

  const handleClose = () => {
    setSev('med');
    setCamIndex(0);
    setDesc('');
    closeModal();
  };

  const handleSubmit = () => {
    const c = liveCameras[camIndex] || { name: 'Camera' };
    const bare = c.name.replace(' Camera', '');
    const description = desc.trim() || 'Incident reported by user.';

    const confMap = { low: 55, med: 80, high: 97 };

    const newEv = {
      day: 'Today',
      type: 'incident' as const,
      dot: 'var(--red)',
      t: `Incident — ${bare}`,
      s: description.slice(0, 60),
      time: hhmm(),
      dur: '—',
      cam: bare,
      obj: 'Manual report',
      conf: confMap[sev] || 80,
      rec: 'Reported by user. Awaiting review.',
      title: 'Incident'
    };

    setEvents(prev => [newEv, ...prev]);
    handleClose();
    setActFilter('all');
    go('activity/0');
    toast('Incident reported');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Report incident"
      subtitle="Log an incident manually for the team to review."
      footer={
        <>
          <Button variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="white" onClick={handleSubmit}>
            Submit report
          </Button>
        </>
      }
    >
      <span className="lbl">Severity</span>
      <div className="sev" style={{ marginTop: '8px' }}>
        {(['low', 'med', 'high'] as const).map(s => (
          <button
            key={s}
            type="button"
            className={`${s} ${sev === s ? 'on' : ''}`}
            onClick={() => setSev(s)}
          >
            {s === 'low' ? 'Low' : s === 'med' ? 'Medium' : 'High'}
          </button>
        ))}
      </div>

      <div className="fld">
        <label htmlFor="aiCam">Camera / location</label>
        <select
          className="in"
          id="aiCam"
          value={camIndex}
          onChange={e => setCamIndex(+e.target.value)}
        >
          {liveCameras.map((c, i) => (
            <option key={c.id} value={i}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="fld">
        <label htmlFor="aiDesc">What happened?</label>
        <textarea
          className="in"
          id="aiDesc"
          placeholder="Describe the incident…"
          value={desc}
          onChange={e => setDesc(e.target.value)}
        />
      </div>
    </Modal>
  );
};

export const CreateReportFromEventModal: React.FC = () => {
  const { events, toast } = useApp();
  const { modal, closeModal, openModal } = useModals();

  const isOpen = modal.type === 'createReportFromEvent';
  const eventIndex = modal.type === 'createReportFromEvent' ? modal.eventIndex : 0;
  const event = events[eventIndex];

  const [sev, setSev] = useState<'low' | 'med' | 'high'>('med');
  const [desc, setDesc] = useState<string>(
    event?.type === 'incident'
      ? `Forced entry attempt detected at ${event.cam}.`
      : ''
  );

  if (!isOpen || !event) return null;

  const handleSubmit = () => {
    closeModal();
    toast(`Report submitted · reference #${4200 + eventIndex}`);
    openModal({ type: 'trackResponse', eventIndex });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeModal}
      title="Create report"
      subtitle="File an incident report from this event."
      footer={
        <>
          <Button variant="ghost" onClick={closeModal}>
            Cancel
          </Button>
          <Button variant="white" onClick={handleSubmit}>
            Submit report
          </Button>
        </>
      }
    >
      <span className="lbl">Severity</span>
      <div className="sev" style={{ marginTop: '8px' }}>
        {(['low', 'med', 'high'] as const).map(s => (
          <button
            key={s}
            type="button"
            className={`${s} ${sev === s ? 'on' : ''}`}
            onClick={() => setSev(s)}
          >
            {s === 'low' ? 'Low' : s === 'med' ? 'Medium' : 'High'}
          </button>
        ))}
      </div>

      <div className="fld">
        <label htmlFor="rpDesc">What happened?</label>
        <textarea
          className="in"
          id="rpDesc"
          placeholder="Describe the incident…"
          value={desc}
          onChange={e => setDesc(e.target.value)}
        />
      </div>

      <span className="lbl">Evidence</span>
      <div className="devcard" style={{ marginTop: '8px' }}>
        <div className="thumb" />
        <div>
          <b>{event.cam || 'Event'} footage</b>
          <div className="muted" style={{ fontSize: '12px' }}>
            {event.day} · {event.time} · attached automatically
          </div>
        </div>
      </div>
    </Modal>
  );
};

export const TrackResponseModal: React.FC = () => {
  const { events, currentPlace, go } = useApp();
  const { modal, closeModal } = useModals();

  const isOpen = modal.type === 'trackResponse';
  const eventIndex = modal.type === 'trackResponse' ? modal.eventIndex : 0;
  const event = events[eventIndex];

  if (!isOpen || !event) return null;

  const steps: [status: 'done' | 'act' | 'pend', title: string, desc: string, time: string][] = [
    [
      'done',
      event.type === 'motion'
        ? 'Motion detected by AI'
        : event.type === 'ai'
        ? 'Flagged by AI'
        : 'Incident detected',
      event.time,
      ''
    ],
    ['done', 'Alert sent to command center', '+0:03', ''],
    ['done', 'Operator assigned', '+0:37', ''],
    ['act', 'En route — 2.4 km away', 'Now · ETA 6 min', ''],
    ['pend', 'Arrived on scene', 'Pending', ''],
    ['pend', 'Incident resolved', 'Pending', '']
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeModal}
      wide={true}
      title="Track response"
      subtitle={`${event.title || 'Incident'} · ${event.cam || currentPlace.name} · ${event.time}`}
      footer={
        <Button variant="ghost" block onClick={closeModal}>
          Close
        </Button>
      }
    >
      <div className="etahero">
        <div>
          <div className="muted" style={{ fontSize: '12px' }}>
            Estimated arrival
          </div>
          <div className="eta">6 min</div>
          <div style={{ color: 'var(--blue)', fontSize: '13px', marginTop: '4px' }}>
            Operator in transit
          </div>
        </div>
        <div style={{ width: '1px', alignSelf: 'stretch', background: 'var(--g700)' }} />
        <div className="row" style={{ flex: 1, minWidth: '170px' }}>
          <div className="mav">TB</div>
          <div>
            <b>Tunde Bakare</b>
            <div className="muted" style={{ fontSize: '12px' }}>
              Response officer
            </div>
            <div
              style={{
                color: 'var(--green)',
                fontSize: '12px',
                marginTop: '2px',
                display: 'flex',
                gap: '4px',
                alignItems: 'center'
              }}
            >
              <Icon name="check" size={12} strokeWidth={2.4} /> ID verified
            </div>
          </div>
        </div>
      </div>

      <button
        type="button"
        className="btn btn-g btn-block"
        style={{ margin: '12px 0 20px' }}
        onClick={() => {
          closeModal();
          go('messages/1');
        }}
      >
        <Icon name="chat" size={16} /> Message Tunde
      </button>

      <div className="sec-hd">
        <h2>Response timeline</h2>
      </div>
      <Timeline
        steps={steps.map(s => ({
          status: s[0],
          title: s[1],
          description: s[2]
        }))}
      />
    </Modal>
  );
};
