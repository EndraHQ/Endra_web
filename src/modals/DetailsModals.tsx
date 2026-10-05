import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useModals } from '../context/ModalContext';
import { Modal } from '../components/feedback/Modal';
import { Button } from '../components/common/Button';
import { StatusDot } from '../components/common/Card';
import { statusInfo } from '../utils/formatters';

export const RenamePropertyModal: React.FC = () => {
  const { places, setPlaces, toast } = useApp();
  const { modal, closeModal } = useModals();

  const isOpen = modal.type === 'renameProperty';
  const placeId = modal.type === 'renameProperty' ? modal.placeId : '';
  const place = places.find(p => p.id === placeId);

  const [name, setName] = useState(place ? place.name : '');
  const [err, setErr] = useState('');

  if (!isOpen || !place) return null;

  const handleSave = () => {
    if (!name.trim()) {
      setErr('Enter a name');
      return;
    }
    setPlaces(prev =>
      prev.map(p => (p.id === placeId ? { ...p, name: name.trim() } : p))
    );
    closeModal();
    toast('Property renamed');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeModal}
      title="Rename property"
      footer={
        <>
          <Button variant="ghost" onClick={closeModal}>
            Cancel
          </Button>
          <Button variant="white" onClick={handleSave}>
            Save
          </Button>
        </>
      }
    >
      <div className="fld">
        <label htmlFor="rnN">Property name</label>
        <input
          className="in"
          id="rnN"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') handleSave();
          }}
          autoFocus
        />
        {err && (
          <span style={{ color: 'var(--red)', fontSize: '12.5px', marginTop: '4px' }}>
            {err}
          </span>
        )}
      </div>
    </Modal>
  );
};

export const DeviceDetailsModal: React.FC = () => {
  const { devices, currentPlace } = useApp();
  const { modal, closeModal } = useModals();

  const isOpen = modal.type === 'deviceDetails';
  const deviceName = modal.type === 'deviceDetails' ? modal.deviceName : '';
  const device = devices.find(d => d.name === deviceName);

  if (!isOpen || !device) return null;

  const si = statusInfo(device);

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeModal}
      title={device.name}
      subtitle="Device details"
      footer={
        <Button variant="ghost" block onClick={closeModal}>
          Close
        </Button>
      }
    >
      <div className="kv">
        <span>Type</span>
        <span>{device.k.charAt(0).toUpperCase() + device.k.slice(1)}</span>
      </div>
      <div className="kv">
        <span>ID</span>
        <span className="mono">{device.id}</span>
      </div>
      <div className="kv">
        <span>Zone</span>
        <span>{device.zone}</span>
      </div>
      <div className="kv">
        <span>Property</span>
        <span>{currentPlace.name}</span>
      </div>
      <div className="kv">
        <span>Status</span>
        <span>
          <StatusDot tone={si.dot as any} /> {si.label}
        </span>
      </div>
    </Modal>
  );
};

export const AccessPassModal: React.FC = () => {
  const { connected, user } = useApp();
  const { modal, closeModal } = useModals();

  const isOpen = modal.type === 'accessPass';
  const connectedId = modal.type === 'accessPass' ? modal.connectedId : '';
  const c = connected.find(x => x.id === connectedId);

  if (!isOpen || !c) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeModal}
      title="Access pass"
      subtitle={c.name}
      footer={
        <Button variant="ghost" block onClick={closeModal}>
          Close
        </Button>
      }
    >
      <div className="kv">
        <span>Holder</span>
        <span>{user.name}</span>
      </div>
      <div className="kv">
        <span>Role</span>
        <span>{c.role}</span>
      </div>
      {c.property && (
        <div className="kv">
          <span>Unit</span>
          <span>{c.property}</span>
        </div>
      )}
      <div className="kv">
        <span>Location</span>
        <span>{c.loc}</span>
      </div>
      <div className="kv">
        <span>Status</span>
        <span
          style={{
            color: c.status === 'pending' ? 'var(--orange)' : 'var(--green)'
          }}
        >
          {c.status === 'pending' ? 'Awaiting approval' : 'Active'}
        </span>
      </div>
    </Modal>
  );
};

export const EditFieldModal: React.FC = () => {
  const { user, setUser, setFaceReg, toast } = useApp();
  const { modal, closeModal } = useModals();

  const isOpen = modal.type === 'editField';
  const field = modal.type === 'editField' ? modal.field : 'name';

  const config = {
    name: { label: 'Full name', value: user.name, type: 'text' },
    phone: { label: 'Phone number', value: user.phone, type: 'tel' },
    email: { label: 'Email address', value: user.email, type: 'email' }
  }[field];

  const [val, setVal] = useState(config.value);
  const [err, setErr] = useState('');

  if (!isOpen) return null;

  const handleSave = () => {
    const trimmed = val.trim();
    if (!trimmed) {
      setErr('Enter a value');
      return;
    }
    if (field === 'email' && !/^\S+@\S+\.\S+$/.test(trimmed)) {
      setErr('Enter a valid email');
      return;
    }

    setUser(prev => ({ ...prev, [field]: trimmed }));
    if (field === 'name') {
      setFaceReg(prev =>
        prev.map(f => (f.me ? { ...f, name: trimmed } : f))
      );
    }

    closeModal();
    toast(`${config.label} updated`);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeModal}
      title={config.label}
      footer={
        <>
          <Button variant="ghost" onClick={closeModal}>
            Cancel
          </Button>
          <Button variant="white" onClick={handleSave}>
            Save
          </Button>
        </>
      }
    >
      <div className="fld">
        <label htmlFor="edF">{config.label}</label>
        <input
          className="in"
          id="edF"
          type={config.type}
          value={val}
          onChange={e => setVal(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') handleSave();
          }}
          autoFocus
        />
        {err && (
          <span style={{ color: 'var(--red)', fontSize: '12.5px', marginTop: '4px' }}>
            {err}
          </span>
        )}
      </div>
    </Modal>
  );
};
