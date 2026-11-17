import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { useModals } from '../context/ModalContext';
import { Modal } from '../components/feedback/Modal';
import { Button } from '../components/common/Button';
import { Icon } from '../components/icons/Icon';
import { HouseholdMember } from '../types';
import { initials } from '../utils/formatters';

export const ConnectPropertyWizard: React.FC = () => {
  const { setPlaces, setPlace, refreshDashboardData, toast, go } = useApp();
  const { account } = useAuth();
  const { modal, closeModal } = useModals();

  const isOpen = modal.type === 'connectProperty';

  // Form state for creating owned property
  const [propertyName, setPropertyName] = useState('');
  const [address, setAddress] = useState('');
  const [propertyType, setPropertyType] = useState<'residential' | 'commercial'>('residential');
  const [coords, setCoords] = useState<{ lat?: number; lng?: number; accuracy?: number } | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createErr, setCreateErr] = useState('');

  if (!isOpen) return null;

  const handleClose = () => {
    setPropertyName('');
    setAddress('');
    setPropertyType('residential');
    setCoords(null);
    setCreateErr('');
    closeModal();
  };

  const handleDetectGPS = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      toast('Geolocation is not supported by your browser.');
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy
        });
        setGpsLoading(false);
        toast(`GPS coordinates captured (±${Math.round(pos.coords.accuracy)}m)`);
      },
      (err) => {
        setGpsLoading(false);
        let msg = 'Failed to capture GPS coordinates.';
        if (err.code === 1) msg = 'Location permission denied by browser.';
        else if (err.code === 2) msg = 'GPS signal unavailable.';
        else if (err.code === 3) msg = 'Location request timed out.';
        toast(msg);
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  const handleCreateProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!propertyName.trim()) {
      setCreateErr('Please enter a property name.');
      return;
    }
    if (!address.trim()) {
      setCreateErr('Please enter a full street address.');
      return;
    }

    const userId = Number(account?.userId || account?.id);
    if (!userId) {
      setCreateErr('Authentication required to create a property.');
      return;
    }

    setIsSubmitting(true);
    setCreateErr('');

    try {
      const res = await api.createProperty({
        property_name: propertyName.trim(),
        full_address: address.trim(),
        property_type: propertyType,
        latitude: coords?.lat,
        longitude: coords?.lng
      }, userId);

      const newPlaceId = `prop-${res.id}`;
      const newPlace = {
        id: newPlaceId,
        name: res.property_name,
        type: res.property_type === 'commercial' ? 'Workplace' : 'Residence',
        loc: res.full_address,
        role: 'Owner' as const,
        ig: res.property_type === 'commercial' ? 'building' : 'home',
        cams: 0,
        camsOn: 0,
        assets: 0,
        devices: 0,
        devOn: 0
      };

      setPlaces(prev => [...prev.filter(p => p.id !== newPlaceId), newPlace]);
      setPlace(newPlaceId);
      try {
        localStorage.setItem('endra_active_place_id', newPlaceId);
      } catch {}

      handleClose();
      await refreshDashboardData();
      toast(`Property "${res.property_name}" created successfully.`);
      go('properties');
    } catch (err: any) {
      console.error('Failed to create property:', err);
      setCreateErr(err?.message || 'Failed to create property on backend.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add Property"
      subtitle="Register a residential or commercial property on your ENDRA account."
    >
      <form onSubmit={handleCreateProperty}>
        <div className="fld">
          <label htmlFor="propName">Property Name</label>
          <input
            id="propName"
            className="in"
            placeholder="e.g. Lekki Residence, Victoria Island Office"
            value={propertyName}
            onChange={e => setPropertyName(e.target.value)}
            disabled={isSubmitting}
            autoFocus
          />
        </div>

        <div className="fld">
          <label htmlFor="propAddress">Full Address</label>
          <input
            id="propAddress"
            className="in"
            placeholder="e.g. 84 Ozumba Mbadiwe Ave, Victoria Island, Lagos"
            value={address}
            onChange={e => setAddress(e.target.value)}
            disabled={isSubmitting}
          />
        </div>

        <div className="fld">
          <label>Property Type</label>
          <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
            <button
              type="button"
              className={`btn btn-sm ${propertyType === 'residential' ? 'btn-w' : 'btn-g'}`}
              onClick={() => setPropertyType('residential')}
              style={{ flex: 1 }}
            >
              Residential
            </button>
            <button
              type="button"
              className={`btn btn-sm ${propertyType === 'commercial' ? 'btn-w' : 'btn-g'}`}
              onClick={() => setPropertyType('commercial')}
              style={{ flex: 1 }}
            >
              Commercial
            </button>
          </div>
        </div>

        <div className="fld" style={{ marginTop: '14px' }}>
          <label>GPS Coordinates (Optional)</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
            <button
              type="button"
              className="btn btn-g btn-sm"
              onClick={handleDetectGPS}
              disabled={gpsLoading || isSubmitting}
            >
              <Icon name="pin" size={14} />
              {gpsLoading ? 'Detecting GPS…' : coords ? 'Re-detect GPS' : 'Capture Current Location'}
            </button>
            {coords && (
              <span style={{ fontSize: '12px', color: 'var(--green)' }}>
                ✓ {coords.lat?.toFixed(4)}, {coords.lng?.toFixed(4)}
              </span>
            )}
          </div>
        </div>

        {createErr && (
          <div style={{ color: 'var(--red)', fontSize: '13px', marginTop: '12px' }}>
            {createErr}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '24px' }}>
          <Button variant="ghost" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="white" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating…' : 'Create Property'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export const AddMemberModal: React.FC = () => {
  const { setHousehold, toast } = useApp();
  const { modal, closeModal } = useModals();

  const isOpen = modal.type === 'addMember';

  const [rel, setRel] = useState<string>('');
  const [type, setType] = useState<'adult' | 'child' | 'staff'>('adult');
  const [name, setName] = useState<string>('');
  const [age, setAge] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [photoAdded, setPhotoAdded] = useState<boolean>(false);
  const [err, setErr] = useState<string>('');

  if (!isOpen) return null;

  const rels: [string, 'adult' | 'child' | 'staff'][] = [
    ['Husband', 'adult'],
    ['Wife', 'adult'],
    ['Son', 'child'],
    ['Daughter', 'child'],
    ['Parent', 'adult'],
    ['Relative', 'adult'],
    ['Maid', 'staff'],
    ['Driver', 'staff']
  ];

  const handleClose = () => {
    setRel('');
    setType('adult');
    setName('');
    setAge('');
    setPhone('');
    setPhotoAdded(false);
    setErr('');
    closeModal();
  };

  const handleAdd = () => {
    if (!name.trim()) {
      setErr('Enter a name');
      return;
    }
    const newMember: HouseholdMember = {
      name: name.trim(),
      rel: rel,
      type: type,
      age: type === 'child' ? age || '—' : undefined
    };

    setHousehold((prev: HouseholdMember[]) => [...prev, newMember]);
    handleClose();
    toast(type === 'adult' ? `Invite sent to ${name}` : `${name} added`);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add member"
      subtitle="Choose their relationship, then add details."
      footer={
        rel ? (
          <>
            <Button variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
            <Button variant="white" onClick={handleAdd}>
              {type === 'adult' ? 'Send invite' : `Add ${rel.toLowerCase()}`}
            </Button>
          </>
        ) : null
      }
    >
      <span className="lbl">Relationship</span>
      <div className="chips" style={{ margin: '8px 0 18px' }}>
        {rels.map(r => (
          <button
            key={r[0]}
            type="button"
            className={`chip ${rel === r[0] ? 'on' : ''}`}
            onClick={() => {
              setRel(r[0]);
              setType(r[1]);
              setPhotoAdded(false);
            }}
          >
            {r[0]}
          </button>
        ))}
      </div>

      {rel && (
        <>
          <div className="fld">
            <label htmlFor="hhName">Full name</label>
            <input
              className="in"
              id="hhName"
              placeholder={type === 'child' ? 'Child’s name' : 'Full name'}
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
            />
            {err && (
              <span style={{ color: 'var(--red)', fontSize: '12.5px', marginTop: '4px' }}>
                {err}
              </span>
            )}
          </div>

          {type === 'child' && (
            <>
              <div className="fld">
                <label htmlFor="hhAge">Age</label>
                <input
                  className="in"
                  id="hhAge"
                  type="number"
                  min={0}
                  max={17}
                  placeholder="e.g. 6"
                  value={age}
                  onChange={e => setAge(e.target.value)}
                />
              </div>
              <div className="fld">
                <label>Photo</label>
                <label
                  className={`drop ${photoAdded ? 'ok' : ''}`}
                  style={{ display: 'block', padding: '18px' }}
                >
                  {photoAdded ? (
                    <>
                      <Icon name="check" size={20} /> Photo added
                    </>
                  ) : (
                    'Choose a photo'
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={() => setPhotoAdded(true)}
                  />
                </label>
              </div>
              <div className="note">
                Children don’t need a phone. Add name, age and photo — they can activate their own account later.
              </div>
            </>
          )}

          {type === 'staff' && (
            <>
              <div className="fld">
                <label>Face photo</label>
                <label
                  className={`drop ${photoAdded ? 'ok' : ''}`}
                  style={{ display: 'block', padding: '18px' }}
                >
                  {photoAdded ? (
                    <>
                      <Icon name="check" size={20} /> Photo added
                    </>
                  ) : (
                    'Choose a photo'
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={() => setPhotoAdded(true)}
                  />
                </label>
              </div>
              <div className="note">
                Staff (maid, driver) get gate access from their <b>face</b> — no phone required.
              </div>
            </>
          )}

          {type === 'adult' && (
            <>
              <div className="fld">
                <label htmlFor="hhPhone">Phone number</label>
                <input
                  className="in"
                  id="hhPhone"
                  placeholder="+234 …"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                />
              </div>
              <div className="note">
                If they already have ENDRA they simply <b>accept the invite</b>. If not, we send an invitation to install and register with their face.
              </div>
            </>
          )}
        </>
      )}
    </Modal>
  );
};

export const InviteGuestModal: React.FC = () => {
  const { setGuests, toast } = useApp();
  const { modal, closeModal } = useModals();

  const isOpen = modal.type === 'inviteGuest';

  const inDaysStr = (n: number) => {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
  };

  const [guestName, setGuestName] = useState('');
  const [phone, setPhone] = useState('');
  const [from, setFrom] = useState(inDaysStr(0));
  const [to, setTo] = useState(inDaysStr(1));
  const [err, setErr] = useState('');

  if (!isOpen) return null;

  const handleClose = () => {
    setGuestName('');
    setPhone('');
    setFrom(inDaysStr(0));
    setTo(inDaysStr(1));
    setErr('');
    closeModal();
  };

  const handleSend = () => {
    if (!guestName.trim()) {
      setErr('Enter a guest name');
      return;
    }
    if (to && from && to < from) {
      setErr('The end date must be after the start date');
      return;
    }

    setGuests(prev => [...prev, { name: guestName.trim(), to }]);
    handleClose();
    toast(`${guestName} invited${to ? ` · expires ${to}` : ''}`);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Invite guest"
      subtitle="Create temporary access that expires automatically."
      footer={
        <>
          <Button variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="white" onClick={handleSend}>
            Send invitation
          </Button>
        </>
      }
    >
      <div className="fld">
        <label htmlFor="gN">Guest name</label>
        <input
          className="in"
          id="gN"
          placeholder="e.g. Mary Cole"
          value={guestName}
          onChange={e => setGuestName(e.target.value)}
          autoFocus
        />
        {err && (
          <span style={{ color: 'var(--red)', fontSize: '12.5px', marginTop: '4px' }}>
            {err}
          </span>
        )}
      </div>
      <div className="fld">
        <label htmlFor="gP">Phone number</label>
        <input
          className="in"
          id="gP"
          placeholder="+234 …"
          value={phone}
          onChange={e => setPhone(e.target.value)}
        />
      </div>
      <div className="frow">
        <div className="fld">
          <label htmlFor="gF">From</label>
          <input
            className="in"
            id="gF"
            type="date"
            value={from}
            onChange={e => setFrom(e.target.value)}
          />
        </div>
        <div className="fld">
          <label htmlFor="gT">To</label>
          <input
            className="in"
            id="gT"
            type="date"
            value={to}
            onChange={e => setTo(e.target.value)}
          />
        </div>
      </div>
      <div className="note">
        Access is created for the selected dates only and <b>expires automatically</b>. If the guest already has ENDRA, they simply accept — no re-registration.
      </div>
    </Modal>
  );
};
