import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useModals } from '../context/ModalContext';
import { Modal } from '../components/feedback/Modal';
import { Button } from '../components/common/Button';
import { Icon } from '../components/icons/Icon';
import { ID_TYPES } from '../data/idTypes';

export const GovIdVerificationModal: React.FC = () => {
  const { user, setUser, toast } = useApp();
  const { modal, closeModal } = useModals();

  const isOpen = modal.type === 'govId';

  const [selectedType, setSelectedType] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [reading, setReading] = useState(false);
  const [captured, setCaptured] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleClose = () => {
    setSelectedType('');
    setFile(null);
    setReading(false);
    setCaptured(false);
    setSubmitting(false);
    closeModal();
  };

  const handleFileChange = (f: File | null) => {
    if (!f) return;
    setFile(f);
    setReading(true);
    setTimeout(() => {
      setReading(false);
      setCaptured(true);
      toast('File uploaded · details read');
    }, 1400);
  };

  const handleSubmit = () => {
    setSubmitting(true);
    setTimeout(() => {
      setUser(prev => ({
        ...prev,
        govIdType: selectedType || prev.govIdType,
        govIdPending: true,
        govIdVerified: false
      }));
      handleClose();
      toast('ID submitted · review within 24 hours');

      setTimeout(() => {
        setUser(prev => ({
          ...prev,
          govIdPending: false,
          govIdVerified: true
        }));
        toast('Government ID verified');
      }, 2600);
    }, 900);
  };

  const currentDoc = ID_TYPES.find(x => x.k === selectedType);

  if (!selectedType) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title="Which ID are you using?"
        subtitle="Choose the document you want to verify with. You only need to submit the front page."
      >
        <div className="card flush" style={{ background: 'var(--g850)' }}>
          {ID_TYPES.map(t => (
            <button
              key={t.k}
              type="button"
              className="idt"
              onClick={() => setSelectedType(t.k)}
            >
              <div className="ico">{t.ico}</div>
              <div style={{ flex: 1, textAlign: 'left' }}>
                <div className="t" style={{ fontWeight: 600 }}>
                  {t.t}
                </div>
                <div className="muted" style={{ fontSize: '12.5px' }}>
                  {t.s}
                </div>
              </div>
              <Icon name="chevr" size={16} />
            </button>
          ))}
        </div>
        <div className="note" style={{ marginTop: '14px' }}>
          Your document is encrypted in transit and reviewed by ENDRA’s verification team. It is never shared with other residents.
        </div>
      </Modal>
    );
  }

  const docTitle = currentDoc ? currentDoc.t.replace(/ \(.*\)/, '') : 'ID';

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      onBack={() => {
        setSelectedType('');
        setCaptured(false);
      }}
      title={`Front of your ${docTitle}`}
      subtitle="Use a clear photo or scan. All four corners visible, no glare, text readable."
      footer={
        <>
          <Button variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="white"
            disabled={!captured || submitting}
            onClick={handleSubmit}
          >
            {submitting ? 'Submitting…' : 'Submit for verification'}
          </Button>
        </>
      }
    >
      <input
        type="file"
        id="idFile"
        accept="image/*,application/pdf"
        hidden
        onChange={e => handleFileChange(e.target.files?.[0] || null)}
      />

      {reading ? (
        <div className="drop" style={{ cursor: 'default' }}>
          <div className="spin" style={{ margin: '6px auto 12px' }} />
          Reading document…
        </div>
      ) : captured ? (
        <>
          <div className="drop ok" style={{ cursor: 'default' }}>
            <Icon name="check" size={30} strokeWidth={2} />
            <div style={{ fontWeight: 600, marginTop: '6px' }}>File uploaded</div>
            <div className="muted" style={{ fontSize: '12.5px', wordBreak: 'break-all' }}>
              {file?.name || 'document.pdf'}
            </div>
          </div>

          <div
            className="card"
            style={{
              marginTop: '14px',
              background: 'var(--g850)',
              padding: '6px 16px'
            }}
          >
            <div className="row" style={{ padding: '10px 0', fontWeight: 600 }}>
              <Icon name="scan" size={16} /> Details read from document
            </div>
            <div className="kv">
              <span>Document</span>
              <span>{currentDoc?.t}</span>
            </div>
            <div className="kv">
              <span>Name</span>
              <span>{user.name.toUpperCase()}</span>
            </div>
            <div className="kv">
              <span>Number</span>
              <span>•••• •••• 4417</span>
            </div>
            <div className="kv">
              <span>Expires</span>
              <span>08 / 2031</span>
            </div>
            <div className="kv">
              <span>Face match</span>
              <span>
                {user.faceEnrolled ? (
                  <span style={{ color: 'var(--green)' }}>
                    98% · matches your Face ID
                  </span>
                ) : (
                  'Enrol Face ID to match'
                )}
              </span>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-g btn-sm"
            style={{ marginTop: '12px' }}
            onClick={() => {
              setCaptured(false);
              setFile(null);
            }}
          >
            Choose a different file
          </button>
        </>
      ) : (
        <label
          className="drop"
          htmlFor="idFile"
          tabIndex={0}
          style={{ display: 'block' }}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              document.getElementById('idFile')?.click();
            }
          }}
        >
          <Icon name="doc" size={32} />
          <div style={{ fontWeight: 600, color: 'var(--white)', marginTop: '8px' }}>
            Drop a file here or choose one
          </div>
          <div style={{ fontSize: '12.5px', marginTop: '2px' }}>
            {currentDoc?.t} · front · image or PDF
          </div>
        </label>
      )}

      <div className="note" style={{ marginTop: '14px' }}>
        ENDRA checks the document against the face you enrolled, so cameras can tell residents from guests and flagged persons.
      </div>
    </Modal>
  );
};
