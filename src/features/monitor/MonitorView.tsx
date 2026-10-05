import React from 'react';
import { useApp } from '../../context/AppContext';
import { useModals } from '../../context/ModalContext';
import { DeviceItem } from '../../types';
import { Icon } from '../../components/icons/Icon';
import { FeedCanvas } from '../../components/media/FeedCanvas';
import { TabStrip } from '../../components/common/TabStrip';
import { EmptyState } from '../../components/common/EmptyState';
import { statusInfo, plural } from '../../utils/formatters';
import { CameraDetailView } from './CameraDetailView';
import { GpsMapView, AiFeedView, PlaybackView } from './GpsMapView';

const MON_TABS = [
  { id: 'all', label: 'All' },
  { id: 'live', label: 'Live' },
  { id: 'cameras', label: 'Cameras' },
  { id: 'gps', label: 'GPS' },
  { id: 'ai', label: 'AI' },
  { id: 'playback', label: 'Playback' }
];

export const MonitorView: React.FC = () => {
  const {
    route,
    go,
    currentPlace,
    devices,
    monView,
    setMonView,
    monFilter,
    setMonFilter,
    monSort,
    setMonSort,
    toast
  } = useApp();

  const { openModal } = useModals();

  if (route.a === 'cam') {
    return <CameraDetailView cameraIndex={parseInt(route.b || '0')} />;
  }

  const activeTab = MON_TABS.some(t => t.id === route.a) ? (route.a as string) : 'all';

  const total = devices.length;
  const online = devices.filter(d => d.status !== 'offline').length;
  const alerts = devices.filter(d => ['offline', 'motion', 'alarm', 'alert'].includes(d.status)).length;

  let filteredItems = devices;
  if (activeTab === 'live') {
    filteredItems = devices.filter(d => d.live);
  } else if (activeTab === 'cameras') {
    filteredItems = devices.filter(d => d.k === 'camera');
  } else if (activeTab === 'gps') {
    filteredItems = devices.filter(d => d.k === 'gps');
  }

  if (monFilter !== 'all') {
    filteredItems = filteredItems.filter(d => {
      if (monFilter === 'online') return d.status !== 'offline';
      if (monFilter === 'offline') return d.status === 'offline';
      if (monFilter === 'recording') return d.status === 'recording';
      if (monFilter === 'motion') return d.status === 'motion';
      if (monFilter === 'alarm') return d.status === 'alarm' || d.status === 'alert';
      return true;
    });
  }

  const sortedItems = [...filteredItems];
  const priorityRank = (d: DeviceItem) => {
    const pr: Record<string, number> = {
      offline: 0,
      alarm: 0,
      alert: 0,
      motion: 1,
      recording: 2
    };
    return pr[d.status] ?? 5;
  };

  if (monSort === 'alpha') {
    sortedItems.sort((a, b) => a.name.localeCompare(b.name));
  } else if (monSort === 'priority') {
    sortedItems.sort((a, b) => priorityRank(a) - priorityRank(b));
  } else if (monSort === 'offline') {
    sortedItems.sort((a, b) => (a.status === 'offline' ? 0 : 1) - (b.status === 'offline' ? 0 : 1));
  }

  const handleDeviceClick = (d: DeviceItem) => {
    if (d.k === 'camera') {
      if (d.status === 'offline') {
        toast(`${d.name} is offline — check its power and network`);
      } else {
        go(`monitor/cam/${d.ci}`);
      }
    } else if (d.k === 'gps') {
      go('monitor/gps');
    } else {
      openModal({ type: 'deviceDetails', deviceName: d.name });
    }
  };

  const showControls = ['all', 'live', 'cameras', 'gps'].includes(activeTab);

  return (
    <div>
      <div className="page-hd">
        <div>
          <h1>Monitor</h1>
          <div className="mon-sum" style={{ marginTop: '8px' }}>
            <b>{total}</b> devices · <span className="on">{online} online</span> ·{' '}
            <span className="al">{plural(alerts, 'alert')}</span> at {currentPlace.name}
          </div>
        </div>
        <button
          type="button"
          className="btn btn-w"
          onClick={() => openModal({ type: 'addCamera' })}
        >
          <Icon name="plus" size={17} /> Add camera
        </button>
      </div>

      <div
        className="row"
        style={{
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px',
          marginBottom: '22px'
        }}
      >
        <TabStrip
          tabs={MON_TABS}
          activeTab={activeTab}
          onChange={tabId => go(`monitor/${tabId}`)}
        />

        {showControls && (
          <div className="ctrls">
            <select
              className="in"
              style={{ width: 'auto' }}
              value={monFilter}
              onChange={e => setMonFilter(e.target.value)}
              aria-label="Filter by status"
            >
              <option value="all">All devices</option>
              <option value="online">Online</option>
              <option value="offline">Offline</option>
              <option value="recording">Recording</option>
              <option value="motion">Motion detected</option>
              <option value="alarm">Alarm / alert</option>
            </select>

            <select
              className="in"
              style={{ width: 'auto' }}
              value={monSort}
              onChange={e => setMonSort(e.target.value)}
              aria-label="Sort"
            >
              <option value="priority">Priority first</option>
              <option value="newest">Newest</option>
              <option value="alpha">A to Z</option>
              <option value="offline">Offline first</option>
            </select>

            <div className="seg">
              <button
                type="button"
                className={monView === 'grid' ? 'on' : ''}
                onClick={() => setMonView('grid')}
                aria-label="Grid view"
              >
                <Icon name="grid" size={16} />
              </button>
              <button
                type="button"
                className={monView === 'list' ? 'on' : ''}
                onClick={() => setMonView('list')}
                aria-label="Table view"
              >
                <Icon name="list" size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {activeTab === 'ai' && <AiFeedView />}
      {activeTab === 'playback' && <PlaybackView />}
      {activeTab === 'gps' && <GpsMapView items={sortedItems} />}

      {['all', 'live', 'cameras'].includes(activeTab) && (
        <>
          {sortedItems.length === 0 ? (
            <div className="card">
              <EmptyState
                title="No devices here"
                description="Nothing matches this view yet. Adjust your filters or add a new camera to your security network."
                action={
                  <div className="row" style={{ justifyContent: 'center', gap: '8px' }}>
                    <button
                      type="button"
                      className="btn btn-g btn-sm"
                      onClick={() => setMonFilter('all')}
                    >
                      Clear filter
                    </button>
                    <button
                      type="button"
                      className="btn btn-w btn-sm"
                      onClick={() => openModal({ type: 'addCamera' })}
                    >
                      Add a camera
                    </button>
                  </div>
                }
              />
            </div>
          ) : monView === 'grid' ? (
            <div className="dgrid">
              {sortedItems.map(d => {
                const si = statusInfo(d);
                if (d.k === 'camera') {
                  return (
                    <div
                      key={d.id}
                      className="dcam"
                      onClick={() => handleDeviceClick(d)}
                    >
                      <FeedCanvas device={d} onExpand={() => handleDeviceClick(d)} />
                      <div className="meta">
                        <div className="nm">{d.name}</div>
                        <div className="id">
                          {d.id} · {d.zone}
                        </div>
                        <div className="st">
                          <i className={`sd ${si.dot}`} />
                          {si.label}
                        </div>
                      </div>
                    </div>
                  );
                }
                const isOff = d.status === 'offline';
                return (
                  <div
                    key={d.id}
                    className="dcam"
                    onClick={() => handleDeviceClick(d)}
                  >
                    <div className={`dev ${isOff ? 'off' : ''}`}>
                      <span style={{ fontSize: '34px' }}>{d.ico}</span>
                    </div>
                    <div className="meta">
                      <div className="nm">{d.name}</div>
                      <div className="id">
                        {d.id} · {d.zone}
                      </div>
                      <div className="st">
                        <i className={`sd ${si.dot}`} />
                        {si.label}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="card flush" style={{ overflowX: 'auto' }}>
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Device</th>
                    <th className="hide-s">ID</th>
                    <th className="hide-s">Zone</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedItems.map(d => {
                    const si = statusInfo(d);
                    const isOff = d.status === 'offline';
                    return (
                      <tr
                        key={d.id}
                        className="click"
                        onClick={() => handleDeviceClick(d)}
                      >
                        <td>
                          <div className="row">
                            {d.k === 'camera' ? (
                              <div className={`thumb ${isOff ? 'off' : ''}`}>
                                {!isOff && <i />}
                              </div>
                            ) : (
                              <div
                                className="ico"
                                style={{
                                  width: '64px',
                                  height: '36px',
                                  borderRadius: '8px',
                                  fontSize: '18px'
                                }}
                              >
                                {d.ico}
                              </div>
                            )}
                            <b>{d.name}</b>
                          </div>
                        </td>
                        <td className="hide-s mono muted">{d.id}</td>
                        <td className="hide-s">{d.zone}</td>
                        <td>
                          <i className={`sd ${si.dot}`} /> {si.label}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};
