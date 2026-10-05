import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useModals } from '../context/ModalContext';
import { Modal } from '../components/feedback/Modal';
import { Button } from '../components/common/Button';
import { Icon } from '../components/icons/Icon';
import { CPOOL, CROLES } from '../data/estates';
import { ConnectedPlace, HouseholdMember } from '../types';
import { initials } from '../utils/formatters';

export const ConnectPropertyWizard: React.FC = () => {
  const { setConnected, toast, go } = useApp();
  const { modal, closeModal } = useModals();

  const isOpen = modal.type === 'connectProperty';

  const [search, setSearch] = useState('');
  const [selectedEstate, setSelectedEstate] = useState<{ id: string; name: string; loc: string } | null>(null);
  const [role, setRole] = useState<string>('');
  const [unit, setUnit] = useState<string>('');
  const [employer, setEmployer] = useState<string>('');
  const [step, setStep] = useState<number>(1);
  const [err, setErr] = useState<string>('');

  if (!isOpen) return null;

  const handleClose = () => {
    setSearch('');
    setSelectedEstate(null);
    setRole('');
    setUnit('');
    setEmployer('');
    setStep(1);
    setErr('');
    closeModal();
  };

  const handlePickEstate = (estate: { id: string; name: string; loc: string }) => {
    setSelectedEstate(estate);
    setStep(2);
  };

  const handlePickRole = (selectedRole: string) => {
    setRole(selectedRole);
    if (selectedRole === 'Visitor') {
      setStep(4);
    } else {
      setStep(3);
    }
  };

  const handleNextUnit = () => {
    if (!unit.trim()) {
      setErr('Enter the unit number');
      return;
    }
    setErr('');
    setStep(4);
  };

  const handleSubmit = () => {
    if (!selectedEstate) return;
    const st = role === 'Visitor' ? 'active' : 'pending';
    const newConn: ConnectedPlace = {
      id: `${selectedEstate.id}-${Date.now().toString().slice(-4)}`,
      name: selectedEstate.name,
      loc: selectedEstate.loc,
      role: role,
      property: unit.trim(),
      status: st as 'active' | 'pending',
      ig: 'link'
    };

    setConnected((prev: ConnectedPlace[]) => [...prev, newConn]);
    handleClose();
    go('properties');
    toast(
      st === 'pending'
        ? 'Request sent · pending verification'
        : `Connected to ${selectedEstate.name}`
    );
  };

  // Step 1: Search & Pick Estate
  if (step === 1) {
    const ql = search.toLowerCase();
    const list = CPOOL.filter(
      p => !ql || p.name.toLowerCase().includes(ql) || p.loc.toLowerCase().includes(ql)
    );

    return (
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title="Connect to a property"
        subtitle="Search for an estate, office, school or church."
      >
        <div className="fld">
          <input
            className="in"
            placeholder="Search properties…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            aria-label="Search properties"
            autoFocus
          />
        </div>
        {list.length > 0 ? (
          list.map(p => (
            <button
              key={p.id}
              type="button"
              className="optc"
              onClick={() => handlePickEstate(p)}
            >
              <div className="ico">{initials(p.name)}</div>
              <div style={{ flex: 1 }}>
                <div className="t">{p.name}</div>
                <div className="s">{p.loc}</div>
              </div>
              <Icon name="chevr" size={16} />
            </button>
          ))
        ) : (
          <div className="empty">No properties found.</div>
        )}
      </Modal>
    );
  }

  // Step 2: Pick Role
  if (step === 2 && selectedEstate) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        onBack={() => setStep(1)}
        title="Your relationship"
        subtitle={`What is your relationship with ${selectedEstate.name}?`}
      >
        {CROLES.map(r => (
          <button
            key={r[0]}
            type="button"
            className="optc"
            onClick={() => handlePickRole(r[0])}
          >
            <div className="ico"><Icon name={r[1]} size={20} /></div>
            <div style={{ flex: 1 }}>
              <div className="t">{r[0]}</div>
              <div className="s">{r[2]}</div>
            </div>
            <Icon name="chevr" size={16} />
          </button>
        ))}
      </Modal>
    );
  }

  // Step 3: Unit and Employer Details
  if (step === 3 && selectedEstate) {
    const isWorker = role === 'Worker';
    return (
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        onBack={() => setStep(2)}
        title={isWorker ? 'Your employer' : 'Property details'}
        subtitle={isWorker ? 'Which unit do you work for?' : 'Which unit are you claiming?'}
        footer={
          <Button variant="white" onClick={handleNextUnit}>
            Continue
          </Button>
        }
      >
        <div className="fld">
          <label htmlFor="cUnit">
            {isWorker ? 'House / unit of employer' : 'House / unit number'}
          </label>
          <input
            className="in"
            id="cUnit"
            placeholder="e.g. House 21"
            value={unit}
            onChange={e => setUnit(e.target.value)}
            autoFocus
          />
          {err && (
            <span style={{ color: 'var(--red)', fontSize: '12.5px', marginTop: '4px' }}>
              {err}
            </span>
          )}
        </div>

        {isWorker && (
          <div className="fld">
            <label htmlFor="cEmp">Employer name</label>
            <input
              className="in"
              id="cEmp"
              placeholder="e.g. Mr James"
              value={employer}
              onChange={e => setEmployer(e.target.value)}
            />
          </div>
        )}

        <div className="note">
          {isWorker
            ? 'Your employer will approve your access.'
            : role === 'Tenant'
            ? 'The property owner or manager will approve your tenancy.'
            : 'The estate will verify that you own this unit.'}
        </div>
      </Modal>
    );
  }

  // Step 4: Review Request
  if (step === 4 && selectedEstate) {
    const ap =
      role === 'Property Owner'
        ? 'the estate management'
        : role === 'Tenant'
        ? 'the property owner / manager'
        : role === 'Worker'
        ? `your employer (${employer || 'resident'})`
        : role === 'Visitor'
        ? 'the resident hosting you'
        : 'the community admin';

    return (
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        onBack={() => (role === 'Visitor' ? setStep(2) : setStep(3))}
        title="Review request"
        subtitle="Confirm your details before submitting."
        footer={
          <Button variant="white" onClick={handleSubmit}>
            Submit request
          </Button>
        }
      >
        <div className="kv">
          <span>Property</span>
          <span>{selectedEstate.name}</span>
        </div>
        <div className="kv">
          <span>Location</span>
          <span>{selectedEstate.loc}</span>
        </div>
        <div className="kv">
          <span>Role</span>
          <span>{role}</span>
        </div>
        {unit && (
          <div className="kv">
            <span>Unit</span>
            <span>{unit}</span>
          </div>
        )}
        {employer && (
          <div className="kv">
            <span>Employer</span>
            <span>{employer}</span>
          </div>
        )}

        <div className="note sec" style={{ marginTop: '14px' }}>
          <Icon name="search" size={17} />
          <span>
            <b>Needs verification.</b> This request will be sent to {ap} for approval. You get access once approved.
          </span>
        </div>
      </Modal>
    );
  }

  return null;
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
