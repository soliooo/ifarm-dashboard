
import { useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import './App.css';

type Status = 'Normal' | 'Warning' | 'Offline';

type SensorType =
  | 'Soil Moisture'
  | 'Air Humidity'
  | 'Light Intensity'
  | 'CO2 Level'
  | 'Temperature'
  | 'Soil pH'
  | 'EC/Salinity'
  | 'Water Pressure';

type Sensor = {
  id: string;
  name: string;
  type: SensorType;
  zone: string;
  value: number;
  unit: string;
  status: Status;
  lastUpdated: string;
};

type Reading = {
  timestamp: string;
  date: string;
  values: Record<string, number>;
};

const sensorTypes: SensorType[] = [
  'Soil Moisture',
  'Air Humidity',
  'Light Intensity',
  'CO2 Level',
  'Temperature',
  'Soil pH',
  'EC/Salinity',
  'Water Pressure',
];

const zones = ['Greenhouse A', 'Greenhouse B', 'Open Field'];

const units: Record<SensorType, string> = {
  'Soil Moisture': '%',
  'Air Humidity': '%',
  'Light Intensity': 'lux',
  'CO2 Level': 'ppm',
  Temperature: '°C',
  'Soil pH': 'pH',
  'EC/Salinity': 'mS/cm',
  'Water Pressure': 'bar',
};

const initialSensors: Sensor[] = [
  { id: 'SM-001', name: 'Soil Moisture North', type: 'Soil Moisture', zone: zones[0], value: 42, unit: '%', status: 'Normal', lastUpdated: '2 min ago' },
  { id: 'SM-002', name: 'Soil Moisture South', type: 'Soil Moisture', zone: zones[1], value: 24, unit: '%', status: 'Warning', lastUpdated: '4 min ago' },
  { id: 'AH-003', name: 'Air Humidity Main', type: 'Air Humidity', zone: zones[0], value: 65, unit: '%', status: 'Normal', lastUpdated: '1 min ago' },
  { id: 'AH-004', name: 'Air Humidity Field', type: 'Air Humidity', zone: zones[2], value: 51, unit: '%', status: 'Normal', lastUpdated: '3 min ago' },
  { id: 'LI-005', name: 'Light Sensor East', type: 'Light Intensity', zone: zones[0], value: 820, unit: 'lux', status: 'Normal', lastUpdated: '2 min ago' },
  { id: 'LI-006', name: 'Light Sensor West', type: 'Light Intensity', zone: zones[1], value: 310, unit: 'lux', status: 'Warning', lastUpdated: '8 min ago' },
  { id: 'CO-007', name: 'CO2 Monitor A', type: 'CO2 Level', zone: zones[0], value: 540, unit: 'ppm', status: 'Normal', lastUpdated: '2 min ago' },
  { id: 'CO-008', name: 'CO2 Monitor B', type: 'CO2 Level', zone: zones[1], value: 1100, unit: 'ppm', status: 'Warning', lastUpdated: '6 min ago' },
  { id: 'TE-009', name: 'Temperature North', type: 'Temperature', zone: zones[0], value: 25.4, unit: '°C', status: 'Normal', lastUpdated: '1 min ago' },
  { id: 'TE-010', name: 'Temperature Field', type: 'Temperature', zone: zones[2], value: 33.8, unit: '°C', status: 'Warning', lastUpdated: '5 min ago' },
  { id: 'PH-011', name: 'Soil pH Sensor', type: 'Soil pH', zone: zones[1], value: 6.5, unit: 'pH', status: 'Normal', lastUpdated: '3 min ago' },
  { id: 'EC-012', name: 'Salinity Sensor', type: 'EC/Salinity', zone: zones[1], value: 1.4, unit: 'mS/cm', status: 'Normal', lastUpdated: '4 min ago' },
  { id: 'TE-013', name: 'Temperature Greenhouse', type: 'Temperature', zone: zones[1], value: 0, unit: '°C', status: 'Offline', lastUpdated: '2 hours ago' },
  { id: 'WP-014', name: 'Water Pressure Main', type: 'Water Pressure', zone: zones[2], value: 2.2, unit: 'bar', status: 'Normal', lastUpdated: '2 min ago' },
  { id: 'SM-015', name: 'Soil Moisture Field', type: 'Soil Moisture', zone: zones[2], value: 18, unit: '%', status: 'Warning', lastUpdated: '7 min ago' },
  { id: 'WP-016', name: 'Water Pressure Backup', type: 'Water Pressure', zone: zones[1], value: 0, unit: 'bar', status: 'Offline', lastUpdated: '1 hour ago' },
];

const history: Reading[] = Array.from({ length: 30 }, (_, index) => {
  const date = new Date();
  date.setDate(date.getDate() - (29 - index));

  const day = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  return {
    timestamp: date.toISOString(),
    date: day,
    values: {
      'Soil Moisture': 38 + Math.sin(index / 3) * 8 + index * 0.08,
      'Air Humidity': 58 + Math.cos(index / 4) * 9,
      'Light Intensity': 650 + Math.sin(index / 2) * 180,
      'CO2 Level': 490 + Math.cos(index / 5) * 95,
      Temperature: 24 + Math.sin(index / 4) * 4,
      'Soil pH': 6.4 + Math.sin(index / 6) * 0.3,
      'EC/Salinity': 1.3 + Math.cos(index / 6) * 0.2,
      'Water Pressure': 2.1 + Math.sin(index / 5) * 0.3,
    },
  };
});

function StatusBadge({ status }: { status: Status }) {
  const className =
    status === 'Normal'
      ? 'status-normal'
      : status === 'Warning'
        ? 'status-warning'
        : 'status-offline';

  return <span className={`badge ${className}`}>{status}</span>;
}

function App() {
  const [page, setPage] = useState<'Sensors' | 'Reports'>('Sensors');
  const [search, setSearch] = useState('');
  const [zoneFilter, setZoneFilter] = useState('All Zones');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [reportType, setReportType] = useState<SensorType>('Soil Moisture');
  const [period, setPeriod] = useState<'7' | '30'>('7');
  const [selectedSensor, setSelectedSensor] = useState<Sensor | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const filteredSensors = useMemo(() => {
    const query = search.trim().toLowerCase();

    return initialSensors.filter((sensor) => {
      const matchesSearch =
        !query ||
        sensor.id.toLowerCase().includes(query) ||
        sensor.name.toLowerCase().includes(query) ||
        sensor.type.toLowerCase().includes(query);

      const matchesZone =
        zoneFilter === 'All Zones' || sensor.zone === zoneFilter;

      const matchesType =
        typeFilter === 'All Types' || sensor.type === typeFilter;

      const matchesStatus =
        statusFilter === 'All Statuses' || sensor.status === statusFilter;

      return matchesSearch && matchesZone && matchesType && matchesStatus;
    });
  }, [search, zoneFilter, typeFilter, statusFilter]);

  const reportSensors = useMemo(
    () =>
      initialSensors.filter(
        (sensor) =>
          (zoneFilter === 'All Zones' || sensor.zone === zoneFilter) &&
          (typeFilter === 'All Types' || sensor.type === typeFilter) &&
          sensor.status !== 'Offline',
      ),
    [zoneFilter, typeFilter],
  );

  const visibleHistory = history.slice(period === '7' ? -7 : -30);

  const reportChart = useMemo(() => {
    return visibleHistory.map((reading) => ({
      date: reading.date,
      value: reading.values[reportType],
    }));
  }, [visibleHistory, reportType]);

  const reportValues = reportChart.map((reading) => reading.value);
  const average = reportValues.length
    ? reportValues.reduce((sum, value) => sum + value, 0) / reportValues.length
    : 0;
  const minimum = reportValues.length ? Math.min(...reportValues) : 0;
  const maximum = reportValues.length ? Math.max(...reportValues) : 0;

  const count = reportValues.length;

  function resetFilters() {
    setSearch('');
    setZoneFilter('All Zones');
    setTypeFilter('All Types');
    setStatusFilter('All Statuses');
  }

  function exportCSV() {
    const header = ['Timestamp', 'Sensor ID', 'Sensor Type', 'Zone', 'Value', 'Unit'];

    const rows = reportSensors.flatMap((sensor) =>
      visibleHistory.map((reading) => [
        reading.timestamp,
        sensor.id,
        sensor.type,
        sensor.zone,
        reading.values[sensor.type].toFixed(2),
        sensor.unit,
      ]),
    );

    const csv = [header, ...rows]
      .map((row) =>
        row
          .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
          .join(','),
      )
      .join('\r\n');

    const blob = new Blob(['\uFEFF', csv], {
      type: 'text/csv;charset=utf-8;',
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ifarm-report-${period}-days.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  const metricTypes: SensorType[] = [
    'Soil Moisture',
    'Air Humidity',
    'Light Intensity',
    'CO2 Level',
  ];

  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? 'sidebar-open' : ''}`}>
        <div className="brand">
          <div className="brand-icon">🌱</div>
          <div>
            <strong>iFarm</strong>
            <span>Smart Agriculture</span>
          </div>
        </div>

        <div className="sidebar-label">WORKSPACE</div>

        <button
          className="nav-item"
          onClick={() => {
            setPage('Sensors');
            setMenuOpen(false);
          }}
        >
          <span>▦</span> Overview
        </button>

        <button
          className={`nav-item ${page === 'Sensors' ? 'active' : ''}`}
          onClick={() => {
            setPage('Sensors');
            setMenuOpen(false);
          }}
        >
          <span>⌁</span> Sensors
        </button>

        <button className="nav-item unavailable" title="Not included in this assessment">
          <span>◉</span> Cameras <small>Demo</small>
        </button>

        <button
          className={`nav-item ${page === 'Reports' ? 'active' : ''}`}
          onClick={() => {
            setPage('Reports');
            setMenuOpen(false);
          }}
        >
          <span>▤</span> Reports
        </button>

        <button className="nav-item unavailable" title="Not included in this assessment">
          <span>◌</span> Thermal Imaging <small>Demo</small>
        </button>

        <button className="nav-item unavailable" title="Not included in this assessment">
          <span>⚙</span> Settings &amp; Support
        </button>

        <div className="sidebar-footer">
          <div className="farm-avatar">IF</div>
          <div>
            <strong>Green Valley Farm</strong>
            <span>Farm Administrator</span>
          </div>
        </div>
      </aside>

      {menuOpen && (
        <button
          className="mobile-backdrop"
          aria-label="Close navigation"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <main className="main-content">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="menu-toggle"
              aria-label="Toggle navigation"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              ☰
            </button>
            <div>
              <div className="breadcrumb">Green Valley Farm / Dashboard</div>
              <h2>{page}</h2>
            </div>
          </div>

          <div className="topbar-right">
            <div className="weather">
              <span>☀</span>
              <div>
                <strong>24°C</strong>
                <small>Sunny</small>
              </div>
            </div>
            <div className="date-label">
              {new Date().toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </div>
            <div className="profile">
              <div className="profile-avatar">SA</div>
              <div className="profile-text">
                <strong>Farm Admin</strong>
                <small>Administrator</small>
              </div>
            </div>
          </div>
        </header>

        <div className="page-body">
          <div className="welcome-row">
            <div>
              <h1>{page === 'Sensors' ? 'Sensor Monitoring' : 'Reports & Analytics'}</h1>
              <p>
                {page === 'Sensors'
                  ? 'Monitor your farm sensors and current environmental conditions.'
                  : 'Explore historical readings and analyze farm performance.'}
              </p>
            </div>
            <div className="live-indicator">
              <span /> Mock data environment
            </div>
          </div>

          <div className="summary-grid">
            <div className="summary-card">
              <div className="summary-icon green">⌁</div>
              <span>Total Sensors</span>
              <strong>{initialSensors.length}</strong>
              <small>Across all farm zones</small>
            </div>
            <div className="summary-card">
              <div className="summary-icon blue">✓</div>
              <span>Normal</span>
              <strong>{initialSensors.filter((s) => s.status === 'Normal').length}</strong>
              <small>Operating normally</small>
            </div>
            <div className="summary-card">
              <div className="summary-icon amber">!</div>
              <span>Warning</span>
              <strong>{initialSensors.filter((s) => s.status === 'Warning').length}</strong>
              <small>Need attention</small>
            </div>
            <div className="summary-card">
              <div className="summary-icon red">×</div>
              <span>Offline</span>
              <strong>{initialSensors.filter((s) => s.status === 'Offline').length}</strong>
              <small>Not reporting readings</small>
            </div>
          </div>

          {page === 'Sensors' ? (
            <>
              <section className="panel">
                <div className="section-heading">
                  <div>
                    <h2>All Sensors</h2>
                    <p>Search and filter your connected sensor inventory.</p>
                  </div>
                  <span className="result-count">{filteredSensors.length} sensors</span>
                </div>

                <div className="report-filters">
                  <input
                    aria-label="Search sensors"
                    placeholder="Search ID, name, or type..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />

                  <select
                    aria-label="Filter zone"
                    value={zoneFilter}
                    onChange={(event) => setZoneFilter(event.target.value)}
                  >
                    <option>All Zones</option>
                    {zones.map((zone) => (
                      <option key={zone}>{zone}</option>
                    ))}
                  </select>

                  <select
                    aria-label="Filter sensor type"
                    value={typeFilter}
                    onChange={(event) => setTypeFilter(event.target.value)}
                  >
                    <option>All Types</option>
                    {sensorTypes.map((type) => (
                      <option key={type}>{type}</option>
                    ))}
                  </select>

                  <select
                    aria-label="Filter status"
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                  >
                    <option>All Statuses</option>
                    <option>Normal</option>
                    <option>Warning</option>
                    <option>Offline</option>
                  </select>

                  <button onClick={resetFilters}>Clear Filters</button>
                </div>

                {filteredSensors.length === 0 ? (
                  <div className="empty-state">
                    <h3>No sensors found</h3>
                    <p>Try changing your search or filters.</p>
                    <button onClick={resetFilters}>Clear Filters</button>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table>
                      <thead>
                        <tr>
                          <th>Sensor</th>
                          <th>Type</th>
                          <th>Zone</th>
                          <th>Current Reading</th>
                          <th>Status</th>
                          <th>Last Updated</th>
                          <th>Details</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredSensors.map((sensor) => (
                          <tr key={sensor.id}>
                            <td>
                              <strong>{sensor.id}</strong>
                              <div className="muted-cell">{sensor.name}</div>
                            </td>
                            <td>{sensor.type}</td>
                            <td>{sensor.zone}</td>
                            <td>
                              {sensor.status === 'Offline'
                                ? '—'
                                : `${sensor.value} ${sensor.unit}`}
                              {sensor.status === 'Offline' && (
                                <div className="muted-cell">Last known reading</div>
                              )}
                            </td>
                            <td><StatusBadge status={sensor.status} /></td>
                            <td>{sensor.lastUpdated}</td>
                            <td>
                              <button
                                className="details-button"
                                onClick={() => setSelectedSensor(sensor)}
                              >
                                View
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </>
          ) : (
            <>
              <section className="panel">
                <div className="section-heading">
                  <div>
                    <h2>Report Filters</h2>
                    <p>Choose the data and time period for your report.</p>
                  </div>
                  <button className="primary-button" onClick={exportCSV}>
                    ↓ Export CSV
                  </button>
                </div>

                <div className="report-filters">
                  <label>
                    Zone
                    <select
                      value={zoneFilter}
                      onChange={(event) => setZoneFilter(event.target.value)}
                    >
                      <option>All Zones</option>
                      {zones.map((zone) => (
                        <option key={zone}>{zone}</option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Sensor Type
                    <select
                      value={reportType}
                      onChange={(event) => setReportType(event.target.value as SensorType)}
                    >
                      {sensorTypes.map((type) => (
                        <option key={type}>{type}</option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Date Range
                    <select
                      value={period}
                      onChange={(event) => setPeriod(event.target.value as '7' | '30')}
                    >
                      <option value="7">Last 7 Days</option>
                      <option value="30">Last 30 Days</option>
                    </select>
                  </label>

                  <button onClick={resetFilters}>Reset Filters</button>
                </div>
              </section>

              <div className="report-metrics">
                <div className="metric-card">
                  <span>Average</span>
                  <strong>{average.toFixed(1)} {units[reportType]}</strong>
                  <small>Selected period</small>
                </div>
                <div className="metric-card">
                  <span>Minimum</span>
                  <strong>{minimum.toFixed(1)} {units[reportType]}</strong>
                  <small>Lowest reading</small>
                </div>
                <div className="metric-card">
                  <span>Maximum</span>
                  <strong>{maximum.toFixed(1)} {units[reportType]}</strong>
                  <small>Highest reading</small>
                </div>
                <div className="metric-card">
                  <span>Readings</span>
                  <strong>{count}</strong>
                  <small>Historical intervals</small>
                </div>
              </div>

              <section className="panel chart-panel">
                <div className="section-heading">
                  <div>
                    <h2>{reportType} Trend</h2>
                    <p>
                      Daily average · {period} days · Unit: {units[reportType]}
                    </p>
                  </div>
                  <span className="result-count">{zoneFilter}</span>
                </div>

                <div className="chart-container">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={reportChart} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="readingGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#12784a" stopOpacity={0.23} />
                          <stop offset="95%" stopColor="#12784a" stopOpacity={0.01} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="date" tickMargin={10} />
                      <YAxis width={55} />
                      <Tooltip formatter={(value) => [`${Number(value).toFixed(1)} ${units[reportType]}`, reportType]} />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#12784a"
                        strokeWidth={2.5}
                        fill="url(#readingGradient)"
                        activeDot={{ r: 5 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </section>

              <section className="panel">
                <div className="section-heading">
                  <div>
                    <h2>Environmental Overview</h2>
                    <p>Average values for key environmental metrics.</p>
                  </div>
                </div>

                <div className="environment-grid">
                  {metricTypes.map((type) => {
                    const series = visibleHistory.map((reading) => ({
                      value: reading.values[type],
                    }));

                    const mean =
                      series.reduce((sum, item) => sum + item.value, 0) /
                      Math.max(series.length, 1);

                    return (
                      <div className="environment-card" key={type}>
                        <span>{type}</span>
                        <strong>{mean.toFixed(1)} <small>{units[type]}</small></strong>
                        <div className="mini-chart">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={series}>
                              <Line
                                type="monotone"
                                dataKey="value"
                                stroke="#12784a"
                                strokeWidth={2}
                                dot={false}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                        <small>Daily trend · {period} days</small>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className="panel">
                <div className="section-heading">
                  <div>
                    <h2>Included Sensors</h2>
                    <p>Online and warning sensors matching the selected zone and type.</p>
                  </div>
                  <span className="result-count">{reportSensors.length} sensors</span>
                </div>
                <div className="table-responsive">
                  <table>
                    <thead>
                      <tr>
                        <th>Sensor ID</th>
                        <th>Type</th>
                        <th>Zone</th>
                        <th>Current Value</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportSensors
                        .filter((sensor) => sensor.type === reportType)
                        .map((sensor) => (
                          <tr key={sensor.id}>
                            <td>{sensor.id}</td>
                            <td>{sensor.type}</td>
                            <td>{sensor.zone}</td>
                            <td>{sensor.value} {sensor.unit}</td>
                            <td><StatusBadge status={sensor.status} /></td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}

          <footer className="page-footer">
            <span>© 2026 iFarm · Smart Agriculture Dashboard</span>
            <span>Frontend assessment · Mock data</span>
          </footer>
        </div>
      </main>

      {selectedSensor && (
        <div
          className="modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedSensor(null);
            }
          }}
        >
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="sensor-detail-title"
          >
            <div className="modal-heading">
              <div>
                <span className="eyebrow">SENSOR DETAILS</span>
                <h2 id="sensor-detail-title">{selectedSensor.name}</h2>
                <p>{selectedSensor.id} · {selectedSensor.zone}</p>
              </div>
              <button
                className="close-button"
                aria-label="Close details"
                onClick={() => setSelectedSensor(null)}
              >
                ×
              </button>
            </div>

            <div className="detail-grid">
              <div>
                <span>Sensor Type</span>
                <strong>{selectedSensor.type}</strong>
              </div>
              <div>
                <span>Status</span>
                <StatusBadge status={selectedSensor.status} />
              </div>
              <div>
                <span>{selectedSensor.status === 'Offline' ? 'Last known reading' : 'Current Reading'}</span>
                <strong>
                  {selectedSensor.status === 'Offline'
                    ? 'No live reading'
                    : `${selectedSensor.value} ${selectedSensor.unit}`}
                </strong>
              </div>
              <div>
                <span>Last Updated</span>
                <strong>{selectedSensor.lastUpdated}</strong>
              </div>
            </div>

            <h3>Historical Readings</h3>
            <p className="modal-description">
              Illustrative daily readings for {selectedSensor.type}.
            </p>

            <div className="detail-chart">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={visibleHistory}
                  margin={{ top: 8, right: 8, left: -15, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis width={45} />
                  <Tooltip
                    formatter={(value) => [
                      `${Number(value).toFixed(1)} ${selectedSensor.unit}`,
                      selectedSensor.type,
                    ]}
                  />
                  <Line
                    type="monotone"
                    dataKey={`values.${selectedSensor.type}`}
                    stroke="#12784a"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <button
              className="primary-button modal-close"
              onClick={() => setSelectedSensor(null)}
            >
              Close Details
            </button>
          </section>
        </div>
      )}
    </div>
  );
}

export default App;
