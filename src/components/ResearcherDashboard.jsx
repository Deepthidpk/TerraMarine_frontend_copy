import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Cell,
  LineChart,
  Line,
  Legend,
  CartesianGrid
} from 'recharts';
import {
  LayoutDashboard,
  Map as MapIcon,
  Compass,
  Layers,
  BarChart3,
  Sliders,
  FolderOpen,
  Camera,
  Database,
  FileText,
  MessageSquare,
  AlertCircle,
  Plus,
  Search,
  Download,
  RefreshCw,
  Play,
  Check,
  AlertTriangle,
  ChevronRight,
  Filter,
  Upload,
  X,
  Send,
  Eye,
  Trash2,
  Calendar,
  Sparkles,
  Info,
  Activity
} from 'lucide-react';

// =========================================================================
// Custom Marker Icons for Leaflet (Avoids Vite asset resolution issues)
// =========================================================================
const createDivIcon = (color, shadowColor = 'rgba(0,0,0,0.5)') => {
  return new L.DivIcon({
    html: `<span style="background-color: ${color}; width: 16px; height: 16px; display: block; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px ${shadowColor}"></span>`,
    className: 'custom-leaflet-marker',
    iconSize: [16, 16],
    iconAnchor: [8, 8]
  });
};

const mapIcons = {
  pollution: createDivIcon('#ff4d4d', '#ff4d4d'),       // Red
  waterQuality: createDivIcon('#00e5ff', '#00e5ff'),    // Cyan
  species: createDivIcon('#9d4edd', '#9d4edd'),         // Purple
  hotspot: createDivIcon('#ffb703', '#ffb703'),         // Amber
  reef: createDivIcon('#ec4899', '#ec4899'),            // Pink (Coral Reefs)
  mangrove: createDivIcon('#10b981', '#10b981'),        // Emerald (Mangroves)
  cleanup: createDivIcon('#00f5d4', '#00f5d4'),         // Greenish Teal
  survey: createDivIcon('#4facfe', '#4facfe'),          // Light Blue
  emergency: createDivIcon('#ef4444', '#ef4444')        // Flashing Red
};

// =========================================================================
// Species Catalog (Pre-seeded real scientific data)
// =========================================================================
const SPECIES_CATALOG = [
  {
    id: 'sp1',
    name: 'Green Sea Turtle',
    scientificName: 'Chelonia mydas',
    category: 'Reptiles',
    status: 'Endangered',
    habitat: 'Coastal waters, lagoons, reefs, and seagrass beds',
    threats: 'Plastic pollution, accidental netting, coastal development',
    sensitivity: 'High',
    notes: 'Frequently observed feeding on seagrass near Fort Kochi.',
    image: 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'sp2',
    name: 'Indian Humpback Dolphin',
    scientificName: 'Sousa plumbea',
    category: 'Mammals',
    status: 'Endangered',
    habitat: 'Shallow coastal waters, estuaries, and river mouths',
    threats: 'Acoustic disturbance, vessel strikes, chemical pollution',
    sensitivity: 'High',
    notes: 'A small group spotted periodically inside the Kochi harbour channel.',
    image: 'https://images.unsplash.com/photo-1570481662006-a3a1374699e8?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'sp3',
    name: 'Indian Mackerel',
    scientificName: 'Rastrelliger kanagurta',
    category: 'Fish',
    status: 'Least Concern',
    habitat: 'Coastal pelagic waters, bays, and reef zones',
    threats: 'Overfishing, rising seawater temperature, microplastics',
    sensitivity: 'Medium',
    notes: 'Major commercial species. Vulnerable to chemical and plastic residues.',
    image: 'https://images.unsplash.com/photo-1534482421-64566f976cfa?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'sp4',
    name: 'Whale Shark',
    scientificName: 'Rhincodon typus',
    category: 'Fish',
    status: 'Endangered',
    habitat: 'Warm coastal seas and open ocean basins',
    threats: 'Ghost nets, marine plastic consumption, ship impacts',
    sensitivity: 'High',
    notes: 'Rare migratory sightings logged offshore.',
    image: 'https://images.unsplash.com/photo-1560275669-46c5a88d6a4c?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'sp5',
    name: 'Staghorn Coral',
    scientificName: 'Acropora cervicornis',
    category: 'Corals',
    status: 'Critically Endangered',
    habitat: 'Shallow reef terraces and lagoons',
    threats: 'Coral bleaching, sediment runoff, high turbidity',
    sensitivity: 'Critical',
    notes: 'Extremely vulnerable to changes in pH and dissolved oxygen levels.',
    image: 'https://images.unsplash.com/photo-1546026423-cc4642628d2b?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'sp6',
    name: 'Zooplankton (Copepods)',
    scientificName: 'Copepoda',
    category: 'Microorganisms',
    status: 'Stable',
    habitat: 'Pelagic zones, estuaries, and benthic environments',
    threats: 'Acidification, petroleum hydrocarbons, microplastics',
    sensitivity: 'High',
    notes: 'Primary food source. Abundance drop indicates chemical contamination.',
    image: 'https://images.unsplash.com/photo-1507624905133-fe72207e32e5?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'sp7',
    name: 'Mangrove Crab',
    scientificName: 'Scylla serrata',
    category: 'Crustaceans',
    status: 'Least Concern',
    habitat: 'Mangrove swamps, muddy coasts, and estuaries',
    threats: 'Habitat loss, chemical runoff, heavy metals',
    sensitivity: 'Medium',
    notes: 'Crucial for mangrove soil aeration. Accumulates bio-toxins.',
    image: 'https://images.unsplash.com/photo-1604313271701-d00e57207604?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'sp8',
    name: 'Seagrass (Tape Grass)',
    scientificName: 'Enhalus acoroides',
    category: 'Plants',
    status: 'Vulnerable',
    habitat: 'Shallow marine mud flats and coral sand shores',
    threats: 'Turbidity block (no sunlight), dredging, oil spills',
    sensitivity: 'High',
    notes: 'Forms carbon sinks. Requires high light penetration.',
    image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'sp9',
    name: 'White-bellied Sea Eagle',
    scientificName: 'Haliaeetus leucogaster',
    category: 'Coastal Birds',
    status: 'Least Concern',
    habitat: 'Coastal cliffs, estuaries, and offshore islands',
    threats: 'Bioaccumulation of poisons, nest disturbance',
    sensitivity: 'Medium',
    notes: 'Top predator. High concentration of plastics in nesting materials.',
    image: 'https://images.unsplash.com/photo-1610996162232-a5e2a39d892d?auto=format&fit=crop&w=400&q=80'
  }
];

// Map Location Resizer to force leaflet rendering layout
const MapResizer = () => {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    const fix = () => map.invalidateSize();
    fix();
    const t = setTimeout(fix, 200);
    return () => clearTimeout(t);
  }, [map]);
  return null;
};

// Location picker click handler
const MapClickHandler = ({ onMapClick }) => {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
};

const ResearcherDashboard = ({
  user,
  reports = [],
  campaigns = [],
  alerts = [],
  notifications = [],
  authFetch,
  navigate,
  fetchDashboardData
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'dashboard';

  // -------------------------------------------------------------------------
  // State variables for various workspaces
  // -------------------------------------------------------------------------
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Tab 2: Ocean Intelligence Map
  const [mapLayers, setMapLayers] = useState({
    pollution: true,
    waterQuality: true,
    species: true,
    hotspots: true,
    reefs: true,
    mangroves: true,
    cleanups: true,
    survey: true,
    emergencies: true
  });
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState([9.976, 76.275]); // Fort Kochi

  // Tab 3: Species Explorer
  const [speciesSearch, setSpeciesSearch] = useState('');
  const [speciesCategory, setSpeciesCategory] = useState('All');
  const [selectedSpecies, setSelectedSpecies] = useState(null);

  // Tab 6: Water Quality Selector
  const [selectedDevice, setSelectedDevice] = useState('all');

  // Tab 7: Research Projects
  const [projects, setProjects] = useState([]);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [projectForm, setProjectForm] = useState({
    title: '',
    description: '',
    study_area: 'Fort Kochi',
    objectives: '',
    start_date: '',
    end_date: ''
  });

  // Tab 8: My Observations
  const [biodiversityObs, setBiodiversityObs] = useState([]);
  const [obsForm, setObsForm] = useState({
    species_name: '',
    scientific_name: '',
    observation: '',
    latitude: '9.976',
    longitude: '76.275',
    observed_date: new Date().toISOString().split('T')[0]
  });
  const [obsFile, setObsFile] = useState(null);
  
  // AI identification
  const [identifying, setIdentifying] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const fileInputRef = useRef(null);

  // Tab 9: Datasets
  const [datasets, setDatasets] = useState([]);
  const [datasetForm, setDatasetForm] = useState({
    name: '',
    description: '',
    project_id: '',
    location: 'Fort Kochi',
    data_type: 'CSV',
    record_count: '0'
  });
  const [datasetFile, setDatasetFile] = useState(null);
  const datasetFileInputRef = useRef(null);

  // Tab 10: Reports Exporter
  const [reportForm, setReportForm] = useState({
    title: 'Coastal Ecological Assessment Report',
    study_area: 'Fort Kochi Beach Zone',
    start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    findings: 'The ecosystem shows steady turbidity drift due to seasonal rains. Plastic accumulation poses high threat to feeding grounds of Chelonia mydas.'
  });
  const [generatedReport, setGeneratedReport] = useState(null);
  const [savedReports, setSavedReports] = useState([]);

  // Tab 11: Research Assistant Chat
  const [chatMessages, setChatMessages] = useState([
    {
      sender: 'assistant',
      text: `### TerraMarine Research Assistant
I can query environmental indicators, water sensor history, pollution logs, and biodiversity observations in real-time.

**Example Inquiries:**
1. *"What species have been observed near Kochi?"*
2. *"List the active pollution incidents in Fort Kochi."*
3. *"Show sensor statistics."*`,
      time: new Date()
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Tab 12: Research Alerts Triggers
  const [researchAlertRules, setResearchAlertRules] = useState([]);
  const [alertRuleForm, setAlertRuleForm] = useState({
    alert_type: 'Turbidity Threshold',
    parameter_name: 'turbidity',
    comparison_operator: '>',
    threshold_value: '20',
    location: 'Fort Kochi',
    severity: 'Medium'
  });

  // -------------------------------------------------------------------------
  // Fetch initial data on mounts
  // -------------------------------------------------------------------------
  useEffect(() => {
    fetchResearchData();
  }, []);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, chatLoading]);

  const fetchResearchData = async () => {
    setLoading(true);
    try {
      // 1. Projects
      const projectsRes = await authFetch('/researcher/projects');
      if (projectsRes.ok) {
        const data = await projectsRes.json();
        setProjects(data.projects || []);
      }

      // 2. Observations
      const obsRes = await authFetch('/researcher/biodiversity');
      if (obsRes.ok) {
        const data = await obsRes.json();
        setBiodiversityObs(data.reports || []);
      }

      // 3. Datasets
      const dataRes = await authFetch('/researcher/datasets');
      if (dataRes.ok) {
        const data = await dataRes.json();
        setDatasets(data.datasets || []);
      }

      // 4. Alerts
      const alertsRes = await authFetch('/researcher/alerts');
      if (alertsRes.ok) {
        const data = await alertsRes.json();
        setResearchAlertRules(data.alerts || []);
      }

      // 5. Reports
      const reportsRes = await authFetch('/researcher/reports');
      if (reportsRes.ok) {
        const data = await reportsRes.json();
        setSavedReports(data.reports || []);
      }

    } catch (error) {
      console.error('Error fetching research workspaces:', error);
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------------------
  // Derived / Mock Datasets for Analytics
  // -------------------------------------------------------------------------
  // Mock Sensor Readings (since they are generated in seed data, we will fetch/simulate)
  const simulatedSensors = useMemo(() => {
    return [
      { name: 'Node W1 - Fort Kochi', type: 'WaterQuality', lat: 9.9763, lng: 76.2753, status: 'Active', ph: 7.8, turbidity: 12.4, temp: 28.2 },
      { name: 'Node W2 - Vypin Entrance', type: 'WaterQuality', lat: 9.9675, lng: 76.2625, status: 'Active', ph: 7.42, turbidity: 28.6, temp: 28.9 },
      { name: 'Node W3 - Cherai Mangroves', type: 'WaterQuality', lat: 10.138, lng: 76.182, status: 'Active', ph: 7.9, turbidity: 8.5, temp: 27.8 }
    ];
  }, []);

  const simulatedSensorHistory = useMemo(() => {
    return [
      { date: 'Aug 23', ph: 7.9, turbidity: 11.2, temp: 28.1 },
      { date: 'Aug 24', ph: 7.82, turbidity: 12.4, temp: 28.2 },
      { date: 'Aug 25', ph: 7.75, turbidity: 14.1, temp: 28.3 },
      { date: 'Aug 26', ph: 7.6, turbidity: 18.5, temp: 28.5 },
      { date: 'Aug 27', ph: 7.55, turbidity: 22.1, temp: 28.8 },
      { date: 'Aug 28', ph: 7.42, turbidity: 28.6, temp: 28.9 },
      { date: 'Aug 29', ph: 7.48, turbidity: 24.3, temp: 28.7 }
    ];
  }, []);

  // Hotspots definition
  const biodiversityHotspots = useMemo(() => {
    return [
      { id: 'h1', name: 'Fort Kochi Estuary Zone', lat: 9.976, lng: 76.275, speciesCount: 14, riskIndex: 78, threat: 'Microplastics & Heavy Litter' },
      { id: 'h2', name: 'Vypin Coastal Reefs', lat: 9.982, lng: 76.280, speciesCount: 19, riskIndex: 42, threat: 'Entanglement Gear (Ghost Nets)' },
      { id: 'h3', name: 'Cherai Mangrove Wetlands', lat: 10.138, lng: 76.182, speciesCount: 22, riskIndex: 18, threat: 'Agricultural Runoff' }
    ];
  }, []);

  // Filtered Species Catalog
  const filteredSpecies = useMemo(() => {
    return SPECIES_CATALOG.filter(sp => {
      const matchSearch = sp.name.toLowerCase().includes(speciesSearch.toLowerCase()) || 
                          sp.scientificName.toLowerCase().includes(speciesSearch.toLowerCase());
      const matchCat = speciesCategory === 'All' || sp.category === speciesCategory;
      return matchSearch && matchCat;
    });
  }, [speciesSearch, speciesCategory]);

  // Coordinate Query handler
  const handleMapCoordinateClick = (lat, lng) => {
    // Find closest hotspots or sensors
    let closestPointName = 'Coastal Sector';
    let pH = 7.7;
    let turbidity = 14.8;
    let temp = 28.3;
    let speciesList = ['Indian Mackerel', 'Moon Jellyfish'];
    let pollutionCount = reports.filter(r => r.status !== 'Completed').length;
    let risk = 'Low';

    // Kochi Beach Zone
    if (Math.abs(lat - 9.976) < 0.02 && Math.abs(lng - 76.275) < 0.02) {
      closestPointName = 'Fort Kochi Beach Sector';
      pH = 7.82;
      turbidity = 12.4;
      temp = 28.2;
      speciesList = ['Green Sea Turtle', 'Indian Humpback Dolphin', 'Indian Mackerel', 'White-bellied Sea Eagle'];
      risk = 'High';
    } 
    // Vypin Harbour Zone
    else if (Math.abs(lat - 9.967) < 0.02 && Math.abs(lng - 76.262) < 0.02) {
      closestPointName = 'Kochi Fishing Harbour Entrance';
      pH = 7.42;
      turbidity = 28.6;
      temp = 28.9;
      speciesList = ['Indian Humpback Dolphin', 'Indian Mackerel', 'Zooplankton (Copepods)'];
      risk = 'High';
    }

    setSelectedLocation({
      lat,
      lng,
      name: closestPointName,
      pH,
      turbidity,
      temp,
      speciesList,
      pollutionCount,
      risk
    });
  };

  // -------------------------------------------------------------------------
  // Project operations
  // -------------------------------------------------------------------------
  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!projectForm.title) return;

    try {
      const res = await authFetch('/researcher/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectForm)
      });
      if (res.ok) {
        setSuccessMessage('Research project created successfully.');
        setProjectForm({
          title: '',
          description: '',
          study_area: 'Fort Kochi',
          objectives: '',
          start_date: '',
          end_date: ''
        });
        setShowProjectModal(false);
        fetchResearchData();
      } else {
        const err = await res.json();
        setErrorMessage(err.error || 'Failed to create project.');
      }
    } catch (error) {
      setErrorMessage('Network error creating project.');
    }
  };

  const handleDeleteProject = async (id) => {
    if (!window.confirm('Delete this research project? Linked data will persist.')) return;
    try {
      const res = await authFetch(`/researcher/projects/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSuccessMessage('Research project deleted.');
        fetchResearchData();
      }
    } catch (error) {
      console.error(error);
    }
  };

  // -------------------------------------------------------------------------
  // Observation operations & AI image identification
  // -------------------------------------------------------------------------
  const handleUploadImageIdentify = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setObsFile(file);

    setIdentifying(true);
    setAiResult(null);

    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await authFetch('/researcher/identify', {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        setAiResult(data.prediction);
        // Pre-fill form
        setObsForm(prev => ({
          ...prev,
          species_name: data.prediction.possibleSpecies,
          scientific_name: data.prediction.scientificName,
          observation: `Confidence: ${data.prediction.confidence}%. Habitat: ${data.prediction.habitat}. Conservation: ${data.prediction.conservationStatus}.`
        }));
      }
    } catch (error) {
      console.error('AI identification error:', error);
    } finally {
      setIdentifying(false);
    }
  };

  const handleCreateObservation = async (e) => {
    e.preventDefault();
    if (!obsForm.species_name) return;

    const formData = new FormData();
    formData.append('species_name', obsForm.species_name);
    formData.append('observation', `${obsForm.scientific_name ? `[${obsForm.scientific_name}] ` : ''}${obsForm.observation}`);
    formData.append('latitude', obsForm.latitude);
    formData.append('longitude', obsForm.longitude);
    formData.append('observed_date', obsForm.observed_date);
    if (obsFile) {
      formData.append('image', obsFile);
    }

    try {
      const res = await authFetch('/researcher/biodiversity', {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        setSuccessMessage('Biodiversity observation recorded.');
        setObsForm({
          species_name: '',
          scientific_name: '',
          observation: '',
          latitude: '9.976',
          longitude: '76.275',
          observed_date: new Date().toISOString().split('T')[0]
        });
        setObsFile(null);
        setAiResult(null);
        fetchResearchData();
        if (fetchDashboardData) fetchDashboardData();
      }
    } catch (error) {
      console.error(error);
    }
  };

  // -------------------------------------------------------------------------
  // Datasets operations
  // -------------------------------------------------------------------------
  const handleUploadDataset = async (e) => {
    e.preventDefault();
    if (!datasetFile || !datasetForm.name) return;

    const formData = new FormData();
    formData.append('file', datasetFile);
    formData.append('name', datasetForm.name);
    formData.append('description', datasetForm.description);
    formData.append('project_id', datasetForm.project_id);
    formData.append('location', datasetForm.location);
    formData.append('data_type', datasetForm.data_type);
    formData.append('record_count', datasetForm.record_count);

    try {
      const res = await authFetch('/researcher/datasets', {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        setSuccessMessage('Dataset file uploaded successfully.');
        setDatasetForm({
          name: '',
          description: '',
          project_id: '',
          location: 'Fort Kochi',
          data_type: 'CSV',
          record_count: '0'
        });
        setDatasetFile(null);
        if (datasetFileInputRef.current) datasetFileInputRef.current.value = '';
        fetchResearchData();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteDataset = async (id) => {
    if (!window.confirm('Remove this dataset file?')) return;
    try {
      const res = await authFetch(`/researcher/datasets/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSuccessMessage('Dataset file deleted.');
        fetchResearchData();
      }
    } catch (error) {
      console.error(error);
    }
  };

  // -------------------------------------------------------------------------
  // Research Alerts (Triggers) operations
  // -------------------------------------------------------------------------
  const handleCreateAlertRule = async (e) => {
    e.preventDefault();
    try {
      const res = await authFetch('/researcher/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alertRuleForm)
      });
      if (res.ok) {
        setSuccessMessage('Threshold alert rule activated.');
        setAlertRuleForm({
          alert_type: 'Turbidity Threshold',
          parameter_name: 'turbidity',
          comparison_operator: '>',
          threshold_value: '20',
          location: 'Fort Kochi',
          severity: 'Medium'
        });
        fetchResearchData();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteAlertRule = async (id) => {
    try {
      const res = await authFetch(`/researcher/alerts/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSuccessMessage('Alert rule removed.');
        fetchResearchData();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleToggleAlertRule = async (id, currentVal) => {
    try {
      const res = await authFetch(`/researcher/alerts/${id}/toggle`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentVal })
      });
      if (res.ok) {
        fetchResearchData();
      }
    } catch (error) {
      console.error(error);
    }
  };

  // -------------------------------------------------------------------------
  // Report generation operations
  // -------------------------------------------------------------------------
  const handleGenerateReport = async (e) => {
    e.preventDefault();
    try {
      const params = {
        charts: ['Turbidity Drift', 'Species Overlap'],
        datasetCount: datasets.length,
        observationsCount: biodiversityObs.length
      };

      const res = await authFetch('/researcher/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: reportForm.title,
          study_area: reportForm.study_area,
          start_date: reportForm.start_date,
          end_date: reportForm.end_date,
          findings: reportForm.findings,
          parameters: params
        })
      });
      if (res.ok) {
        const data = await res.json();
        setGeneratedReport(data.report);
        setSuccessMessage('Research report compiled.');
        fetchResearchData();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteReport = async (id) => {
    try {
      const res = await authFetch(`/researcher/reports/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSuccessMessage('Report record removed.');
        fetchResearchData();
      }
    } catch (error) {
      console.error(error);
    }
  };

  // -------------------------------------------------------------------------
  // Chat Assistant Submission
  // -------------------------------------------------------------------------
  const handleSendChatMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { sender: 'user', text: userMsg, time: new Date() }]);
    setChatLoading(true);

    try {
      const res = await authFetch('/researcher/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg })
      });
      if (res.ok) {
        const data = await res.json();
        setChatMessages(prev => [...prev, { sender: 'assistant', text: data.reply, time: new Date() }]);
      } else {
        setChatMessages(prev => [...prev, { sender: 'assistant', text: 'Error communicating with assistant. Please try again.', time: new Date() }]);
      }
    } catch (error) {
      setChatMessages(prev => [...prev, { sender: 'assistant', text: 'Network failure. Check server telemetry status.', time: new Date() }]);
    } finally {
      setChatLoading(false);
    }
  };

  // Close message boxes
  useEffect(() => {
    if (successMessage) {
      const t = setTimeout(() => setSuccessMessage(''), 3000);
      return () => clearTimeout(t);
    }
  }, [successMessage]);

  useEffect(() => {
    if (errorMessage) {
      const t = setTimeout(() => setErrorMessage(''), 4000);
      return () => clearTimeout(t);
    }
  }, [errorMessage]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', paddingBottom: '80px' }}>
      
      {/* Toast Alert Popups */}
      {successMessage && (
        <div style={{
          position: 'fixed', top: '24px', right: '24px', background: 'rgba(0, 245, 212, 0.95)',
          color: '#051329', padding: '14px 24px', borderRadius: '12px', zIndex: 2000,
          boxShadow: '0 10px 30px rgba(0, 245, 212, 0.4)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px'
        }}>
          <Check size={18} /> {successMessage}
        </div>
      )}
      {errorMessage && (
        <div style={{
          position: 'fixed', top: '24px', right: '24px', background: 'rgba(255, 77, 77, 0.95)',
          color: '#ffffff', padding: '14px 24px', borderRadius: '12px', zIndex: 2000,
          boxShadow: '0 10px 30px rgba(255, 77, 77, 0.4)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px'
        }}>
          <AlertTriangle size={18} /> {errorMessage}
        </div>
      )}

      {/* Header Profile Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <span style={{
            fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.15em',
            color: 'var(--accent-primary)', fontWeight: '700'
          }}>
            Marine Research Portal
          </span>
          <h1 style={{ fontSize: '2.1rem', marginTop: '2px', fontWeight: '800' }}>
            Coastal Research & Marine Intelligence Workspace
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginTop: '4px' }}>
            Ecosystem monitoring, species tracking, and predictive pollution analytics.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button className="btn btn-secondary" onClick={fetchResearchData} style={{ padding: '8px 16px', fontSize: '0.82rem' }}>
            <RefreshCw size={14} className={loading ? 'spin-icon' : ''} /> Sync Data
          </button>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            background: 'rgba(10, 25, 48, 0.85)', padding: '6px 14px', borderRadius: '12px', border: '1px solid rgba(0, 229, 255, 0.2)'
          }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00f5d4', boxShadow: '0 0 8px #00f5d4' }}></div>
            <span style={{ fontSize: '0.8rem', fontWeight: '600' }}>{user.full_name}</span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          TAB 1: OVERVIEW DASHBOARD
          ========================================================================= */}
      {activeTab === 'dashboard' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          
          {/* Top 6 Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '20px' }}>
            
            <div className="stat-card-marine glass-panel">
              <div className="stat-icon-wrapper" style={{ background: 'rgba(0, 229, 255, 0.12)', border: '1px solid rgba(0, 229, 255, 0.3)' }}>
                <Activity size={22} style={{ color: 'var(--accent-primary)' }} />
              </div>
              <div className="stat-content-wrapper">
                <div className="stat-val">78<span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>/100</span></div>
                <div className="stat-lbl">Ocean Health</div>
              </div>
            </div>

            <div className="stat-card-marine glass-panel">
              <div className="stat-icon-wrapper" style={{ background: 'rgba(157, 78, 221, 0.12)', border: '1px solid rgba(157, 78, 221, 0.3)' }}>
                <Compass size={22} style={{ color: 'var(--accent-purple)' }} />
              </div>
              <div className="stat-content-wrapper">
                <div className="stat-val">{biodiversityObs.length + SPECIES_CATALOG.length}</div>
                <div className="stat-lbl">Marine Species</div>
              </div>
            </div>

            <div className="stat-card-marine glass-panel">
              <div className="stat-icon-wrapper" style={{ background: 'rgba(0, 245, 212, 0.12)', border: '1px solid rgba(0, 245, 212, 0.3)' }}>
                <Layers size={22} style={{ color: 'var(--success)' }} />
              </div>
              <div className="stat-content-wrapper">
                <div className="stat-val">82%</div>
                <div className="stat-lbl">Biodiversity Index</div>
              </div>
            </div>

            <div className="stat-card-marine glass-panel">
              <div className="stat-icon-wrapper" style={{ background: 'rgba(0, 229, 255, 0.12)', border: '1px solid rgba(0, 229, 255, 0.3)' }}>
                <Sliders size={22} style={{ color: 'var(--accent-primary)' }} />
              </div>
              <div className="stat-content-wrapper">
                <div className="stat-val" style={{ color: 'var(--success)', fontSize: '1.7rem' }}>Good</div>
                <div className="stat-lbl">Water Quality</div>
              </div>
            </div>

            <div className="stat-card-marine glass-panel">
              <div className="stat-icon-wrapper" style={{ background: 'rgba(2, 132, 199, 0.12)', border: '1px solid rgba(2, 132, 199, 0.3)' }}>
                <MapIcon size={22} style={{ color: 'var(--accent-secondary)' }} />
              </div>
              <div className="stat-content-wrapper">
                <div className="stat-val">{new Set(biodiversityObs.map(o => `${o.latitude},${o.longitude}`)).size || 1}</div>
                <div className="stat-lbl">Survey Locations</div>
              </div>
            </div>

            <div className="stat-card-marine glass-panel">
              <div className="stat-icon-wrapper" style={{ background: 'rgba(255, 183, 3, 0.12)', border: '1px solid rgba(255, 183, 3, 0.3)' }}>
                <AlertCircle size={22} style={{ color: 'var(--warning)' }} />
              </div>
              <div className="stat-content-wrapper">
                <div className="stat-val">{researchAlertRules.filter(r => r.is_active).length}</div>
                <div className="stat-lbl">Ecological Alerts</div>
              </div>
            </div>

          </div>

          {/* Warnings center & Map preview */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '28px' }}>
            
            {/* Warning lists */}
            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '700' }}>Active Ecological Warnings</h3>
                <span className="badge badge-emergency" style={{ background: 'rgba(255, 77, 77, 0.15)', color: '#ff4d4d' }}>Critical Trigger</span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', maxHeight: '310px' }}>
                
                {/* Active alert rules log */}
                {researchAlertRules.length > 0 ? (
                  researchAlertRules.map(rule => (
                    <div key={rule.alert_id} style={{
                      padding: '14px', background: 'rgba(255, 183, 3, 0.08)', border: '1px solid rgba(255, 183, 3, 0.3)',
                      borderRadius: '12px', display: 'flex', gap: '12px', alignItems: 'flex-start'
                    }}>
                      <AlertTriangle size={18} style={{ color: 'var(--warning)', marginTop: '2px', flexShrink: 0 }} />
                      <div>
                        <div style={{ fontWeight: '600', fontSize: '0.85rem' }}>{rule.alert_type} Triggered</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          Sensor readout `{rule.parameter_name}` in {rule.location} crossed {rule.comparison_operator} {rule.threshold_value}.
                        </div>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                          Registered by: {rule.researcher_name}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '14px', background: 'rgba(10, 25, 48, 0.5)', borderRadius: '12px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <Check size={18} style={{ color: 'var(--success)' }} />
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>All ecological sensor values within standard biological limits.</div>
                  </div>
                )}

                {/* Pollution report alert items */}
                {reports.filter(r => r.severity === 'High').map(rep => (
                  <div key={rep.report_id} style={{
                    padding: '14px', background: 'rgba(255, 77, 77, 0.08)', border: '1px solid rgba(255, 77, 77, 0.3)',
                    borderRadius: '12px', display: 'flex', gap: '12px', alignItems: 'flex-start'
                  }}>
                    <AlertCircle size={18} style={{ color: 'var(--danger)', marginTop: '2px', flexShrink: 0 }} />
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '0.85rem' }}>High-severity Pollution Incident</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        {rep.title} ({rep.waste_type}) logged at *{rep.location_name}*.
                      </div>
                    </div>
                  </div>
                ))}

              </div>
            </div>

            {/* What's Changing panel */}
            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '700' }}>What's Changing? Trend Insights</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(10, 25, 48, 0.5)', borderRadius: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '1.2rem' }}>📈</span>
                    <div>
                      <div style={{ fontSize: '0.82rem', fontWeight: '600' }}>Plastic Pollution Density</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Fort Kochi littoral zone</div>
                    </div>
                  </div>
                  <span style={{ fontSize: '0.76rem', color: 'var(--danger)', fontWeight: 'bold' }}>+12% (30d)</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(10, 25, 48, 0.5)', borderRadius: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '1.2rem' }}>📉</span>
                    <div>
                      <div style={{ fontSize: '0.82rem', fontWeight: '600' }}>Water Turbidity Drift</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Vypin Harbour channel</div>
                    </div>
                  </div>
                  <span style={{ fontSize: '0.76rem', color: 'var(--success)', fontWeight: 'bold' }}>-8% (7d)</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(10, 25, 48, 0.5)', borderRadius: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '1.2rem' }}>🐬</span>
                    <div>
                      <div style={{ fontSize: '0.82rem', fontWeight: '600' }}>Humpback Dolphin Sightings</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Outer channel zone</div>
                    </div>
                  </div>
                  <span style={{ fontSize: '0.76rem', color: 'var(--accent-primary)', fontWeight: 'bold' }}>Stable (Avg 3/wk)</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(10, 25, 48, 0.5)', borderRadius: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '1.2rem' }}>🌱</span>
                    <div>
                      <div style={{ fontSize: '0.82rem', fontWeight: '600' }}>Seagrass Restoration Cover</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Lagoon shallow sectors</div>
                    </div>
                  </div>
                  <span style={{ fontSize: '0.76rem', color: 'var(--success)', fontWeight: 'bold' }}>+4% (90d)</span>
                </div>

              </div>
            </div>

          </div>

          {/* Small map & quick tools grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '28px' }}>
            
            {/* Map preview */}
            <div className="glass-panel" style={{ height: '350px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>Ocean GIS Core Preview</h3>
                <button className="btn" onClick={() => setSearchParams({ tab: 'ocean-intelligence' })} style={{ padding: '4px 10px', fontSize: '0.75rem', color: 'var(--accent-primary)' }}>
                  Open Full GIS &rarr;
                </button>
              </div>
              
              <div style={{ flex: 1, borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(0, 229, 255, 0.2)' }}>
                <MapContainer center={mapCenter} zoom={12} style={{ width: '100%', height: '100%' }}>
                  <MapResizer />
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {simulatedSensors.map((s, idx) => (
                    <Marker key={idx} position={[s.lat, s.lng]} icon={mapIcons.waterQuality}>
                      <Popup>Node: {s.name}</Popup>
                    </Marker>
                  ))}
                  {reports.map((r, idx) => {
                    if (!r.latitude || !r.longitude) return null;
                    return (
                      <Marker key={idx} position={[parseFloat(r.latitude), parseFloat(r.longitude)]} icon={mapIcons.pollution}>
                        <Popup>{r.title}</Popup>
                      </Marker>
                    );
                  })}
                </MapContainer>
              </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>Research Quick Actions</h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
                
                <button onClick={() => setSearchParams({ tab: 'my-observations' })} style={{
                  display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: 'rgba(2, 132, 199, 0.12)',
                  border: '1px solid rgba(0, 229, 255, 0.25)', borderRadius: '14px', cursor: 'pointer', textAlign: 'left',
                  transition: 'all 0.2s ease', color: '#ffffff'
                }}>
                  <Camera size={24} style={{ color: 'var(--accent-primary)' }} />
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: '600' }}>Record Species Sighting</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '2px' }}>Log biodiversity with AI recognition.</div>
                  </div>
                </button>

                <button onClick={() => setSearchParams({ tab: 'datasets' })} style={{
                  display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: 'rgba(157, 78, 221, 0.12)',
                  border: '1px solid rgba(157, 78, 221, 0.25)', borderRadius: '14px', cursor: 'pointer', textAlign: 'left',
                  transition: 'all 0.2s ease', color: '#ffffff'
                }}>
                  <Database size={24} style={{ color: 'var(--accent-purple)' }} />
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: '600' }}>Upload Oceanographic Dataset</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '2px' }}>Connect CSV or survey logs.</div>
                  </div>
                </button>

                <button onClick={() => setSearchParams({ tab: 'research-reports' })} style={{
                  display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: 'rgba(0, 245, 212, 0.12)',
                  border: '1px solid rgba(0, 245, 212, 0.25)', borderRadius: '14px', cursor: 'pointer', textAlign: 'left',
                  transition: 'all 0.2s ease', color: '#ffffff'
                }}>
                  <FileText size={24} style={{ color: 'var(--success)' }} />
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: '600' }}>Compile Ecological Report</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '2px' }}>Aggregate telemetry into exports.</div>
                  </div>
                </button>

              </div>
            </div>

          </div>

        </div>
      )}

      {/* =========================================================================
          TAB 2: OCEAN INTELLIGENCE MAP
          ========================================================================= */}
      {activeTab === 'ocean-intelligence' && (
        <div style={{ display: 'grid', gridTemplateColumns: '3fr 1.2fr', gap: '24px', height: '650px' }}>
          
          {/* Main Map Frame */}
          <div className="glass-panel" style={{ padding: 0, position: 'relative', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            
            {/* Top Toolbar Overlay */}
            <div style={{
              position: 'absolute', top: '16px', left: '16px', zIndex: 1000,
              background: 'rgba(10, 25, 48, 0.9)', padding: '10px 16px', borderRadius: '12px',
              border: '1px solid rgba(0, 229, 255, 0.25)', backdropFilter: 'blur(8px)', display: 'flex', gap: '12px'
            }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--accent-primary)', fontWeight: 'bold' }}>GIS Map Layers:</span>
              <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={mapLayers.pollution} onChange={() => setMapLayers(p => ({ ...p, pollution: !p.pollution }))} />
                  Pollution
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={mapLayers.waterQuality} onChange={() => setMapLayers(p => ({ ...p, waterQuality: !p.waterQuality }))} />
                  IoT Nodes
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={mapLayers.species} onChange={() => setMapLayers(p => ({ ...p, species: !p.species }))} />
                  Species Logs
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={mapLayers.hotspots} onChange={() => setMapLayers(p => ({ ...p, hotspots: !p.hotspots }))} />
                  Hotspots
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={mapLayers.reefs} onChange={() => setMapLayers(p => ({ ...p, reefs: !p.reefs }))} />
                  Coral Reefs
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={mapLayers.mangroves} onChange={() => setMapLayers(p => ({ ...p, mangroves: !p.mangroves }))} />
                  Mangroves
                </label>
              </div>
            </div>

            {/* Interactive Leaflet Map Container */}
            <div style={{ flex: 1 }}>
              <MapContainer center={mapCenter} zoom={13} style={{ width: '100%', height: '100%' }}>
                <MapResizer />
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                {/* Click listener to fetch coordinates detail */}
                <MapClickHandler onMapClick={handleMapCoordinateClick} />

                {/* Pollution layer */}
                {mapLayers.pollution && reports.map((r) => {
                  if (!r.latitude || !r.longitude) return null;
                  return (
                    <Marker key={r.report_id} position={[parseFloat(r.latitude), parseFloat(r.longitude)]} icon={mapIcons.pollution}>
                      <Popup>
                        <div style={{ minWidth: '150px' }}>
                          <h4 style={{ margin: 0, fontSize: '0.85rem' }}>{r.title}</h4>
                          <span style={{ fontSize: '0.7rem', color: 'var(--danger)', fontWeight: 'bold' }}>Severity: {r.severity}</span>
                          <p style={{ margin: '4px 0 0 0', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Waste: {r.waste_type}</p>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}

                {/* Water quality telemetry layer */}
                {mapLayers.waterQuality && simulatedSensors.map((s, idx) => (
                  <Marker key={idx} position={[s.lat, s.lng]} icon={mapIcons.waterQuality}>
                    <Popup>
                      <div style={{ minWidth: '160px' }}>
                        <h4 style={{ margin: 0, fontSize: '0.85rem', color: 'var(--accent-primary)' }}>{s.name}</h4>
                        <div style={{ marginTop: '6px', fontSize: '0.72rem', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span>pH: <strong>{s.ph}</strong></span>
                          <span>Turbidity: <strong>{s.turbidity} NTU</strong></span>
                          <span>Temp: <strong>{s.temp}°C</strong></span>
                          <span style={{ color: 'var(--success)' }}>Status: {s.status}</span>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))}

                {/* Species logs layer */}
                {mapLayers.species && biodiversityObs.map((obs) => {
                  if (!obs.latitude || !obs.longitude) return null;
                  return (
                    <Marker key={obs.record_id} position={[parseFloat(obs.latitude), parseFloat(obs.longitude)]} icon={mapIcons.species}>
                      <Popup>
                        <div style={{ minWidth: '160px' }}>
                          <h4 style={{ margin: 0, fontSize: '0.85rem', color: 'var(--accent-purple)' }}>{obs.species_name}</h4>
                          <p style={{ margin: '4px 0 0 0', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Observed: {obs.observation}</p>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}

                {/* Hotspots layer */}
                {mapLayers.hotspots && biodiversityHotspots.map((h) => (
                  <Marker key={h.id} position={[h.lat, h.lng]} icon={mapIcons.hotspot}>
                    <Popup>
                      <div style={{ minWidth: '160px' }}>
                        <h4 style={{ margin: 0, fontSize: '0.85rem', color: 'var(--warning)' }}>{h.name}</h4>
                        <div style={{ marginTop: '6px', fontSize: '0.72rem', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span>Species diversity: <strong>{h.speciesCount} logs</strong></span>
                          <span>Risk: <strong>{h.riskIndex}%</strong></span>
                          <span style={{ color: 'var(--danger)' }}>Threat: {h.threat}</span>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))}

                {/* Reefs layer */}
                {mapLayers.reefs && (
                  <Marker position={[9.985, 76.255]} icon={mapIcons.reef}>
                    <Popup>Staghorn Coral Reef Zone (Restoration Area)</Popup>
                  </Marker>
                )}

                {/* Mangroves layer */}
                {mapLayers.mangroves && (
                  <Marker position={[10.138, 76.182]} icon={mapIcons.mangrove}>
                    <Popup>Cherai Mangrove Sanctuary (Wetland ecology)</Popup>
                  </Marker>
                )}

              </MapContainer>
            </div>
          </div>

          {/* Right info details panel */}
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '700', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
              Coordinate Assessment
            </h3>
            
            {selectedLocation ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: 'bold' }}>Selected sector:</div>
                  <div style={{ fontSize: '1rem', fontWeight: 'bold', marginTop: '2px' }}>{selectedLocation.name}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Coords: {selectedLocation.lat.toFixed(5)}, {selectedLocation.lng.toFixed(5)}
                  </div>
                </div>

                <div style={{ padding: '14px', background: 'rgba(10, 25, 48, 0.6)', border: '1px solid rgba(0, 229, 255, 0.15)', borderRadius: '12px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 'bold', marginBottom: '8px' }}>Water Quality Readings:</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.78rem' }}>
                    <span>pH level: <strong>{selectedLocation.pH}</strong></span>
                    <span>Turbidity: <strong>{selectedLocation.turbidity} NTU</strong></span>
                    <span>Temperature: <strong>{selectedLocation.temp}°C</strong></span>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 'bold', marginBottom: '6px' }}>Life Around This Location:</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {selectedLocation.speciesList.map((s, idx) => (
                      <span key={idx} style={{
                        padding: '4px 10px', background: 'rgba(157, 78, 221, 0.15)', border: '1px solid rgba(157, 78, 221, 0.3)',
                        borderRadius: '20px', fontSize: '0.7rem', color: '#d8b4fe', fontWeight: '600'
                      }}>
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div style={{ padding: '10px', background: 'rgba(10, 25, 48, 0.6)', borderRadius: '10px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Pollution incidents</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--danger)', marginTop: '4px' }}>{selectedLocation.pollutionCount}</div>
                  </div>
                  <div style={{ padding: '10px', background: 'rgba(10, 25, 48, 0.6)', borderRadius: '10px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Ecological Risk</div>
                    <div style={{
                      fontSize: '1rem', fontWeight: 'bold', marginTop: '6px',
                      color: selectedLocation.risk === 'High' ? 'var(--danger)' : 'var(--success)'
                    }}>
                      {selectedLocation.risk}
                    </div>
                  </div>
                </div>

                <button onClick={() => setSearchParams({ tab: 'my-observations' })} className="btn btn-primary" style={{ width: '100%', fontSize: '0.82rem', padding: '10px' }}>
                  Log Observation Here
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px', color: 'var(--text-secondary)', textAlign: 'center' }}>
                <Info size={36} style={{ color: 'var(--accent-primary)', opacity: 0.5, marginBottom: '12px' }} />
                <p style={{ fontSize: '0.85rem' }}>Click anywhere on the map coordinates to fetch environmental telemetry, active reports, and nearby biological sightings.</p>
              </div>
            )}

          </div>

        </div>
      )}

      {/* =========================================================================
          TAB 3: SPECIES EXPLORER
          ========================================================================= */}
      {activeTab === 'species-explorer' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Filters and search */}
          <div className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px', padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
              <Search size={18} style={{ color: 'var(--text-secondary)' }} />
              <input
                type="text"
                className="form-control"
                placeholder="Search marine catalog by scientific name, classification, keyword..."
                value={speciesSearch}
                onChange={(e) => setSpeciesSearch(e.target.value)}
                style={{ border: 'none', background: 'transparent', padding: '6px 0', fontSize: '0.95rem' }}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '8px' }}>
              {['All', 'Mammals', 'Fish', 'Reptiles', 'Corals', 'Crustaceans', 'Microorganisms', 'Plants', 'Coastal Birds'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setSpeciesCategory(cat)}
                  style={{
                    padding: '6px 12px', borderRadius: '8px', fontSize: '0.75rem', border: '1px solid rgba(0, 229, 255, 0.25)',
                    background: speciesCategory === cat ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' : 'rgba(10, 25, 48, 0.5)',
                    color: '#ffffff', cursor: 'pointer', fontWeight: '600'
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
            
            {filteredSpecies.map(sp => (
              <div
                key={sp.id}
                className="glass-panel"
                onClick={() => setSelectedSpecies(sp)}
                style={{ padding: 0, overflow: 'hidden', cursor: 'pointer', display: 'flex', flexDirection: 'column', height: '360px' }}
              >
                <div style={{ height: '160px', overflow: 'hidden', position: 'relative' }}>
                  <img src={sp.image} alt={sp.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <span style={{
                    position: 'absolute', top: '12px', right: '12px', padding: '4px 10px', borderRadius: '20px',
                    fontSize: '0.65rem', fontWeight: 'bold', background: sp.status === 'Endangered' || sp.status === 'Critically Endangered' ? 'rgba(255,77,77,0.85)' : 'rgba(0,245,212,0.85)',
                    color: sp.status === 'Endangered' || sp.status === 'Critically Endangered' ? '#ffffff' : '#051329'
                  }}>
                    {sp.status}
                  </span>
                </div>
                
                <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flex: 1 }}>
                  <div>
                    <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent-primary)', fontWeight: 'bold' }}>
                      {sp.category}
                    </span>
                    <h3 style={{ fontSize: '1.15rem', marginTop: '2px' }}>{sp.name}</h3>
                    <p style={{ fontSize: '0.76rem', fontStyle: 'italic', color: 'var(--text-secondary)' }}>{sp.scientificName}</p>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '8px', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {sp.notes}
                    </p>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '10px' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Sensitivity: <strong style={{ color: 'var(--accent-primary)' }}>{sp.sensitivity}</strong></span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      Profile <ChevronRight size={14} />
                    </span>
                  </div>
                </div>
              </div>
            ))}

          </div>

          {/* Details modal drawer */}
          {selectedSpecies && (
            <div className="modal-overlay" onClick={() => setSelectedSpecies(null)}>
              <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2 style={{ fontSize: '1.4rem' }}>Species Profile Catalog</h2>
                  <button onClick={() => setSelectedSpecies(null)} style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer' }}>
                    <X size={20} />
                  </button>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
                  <div style={{ borderRadius: '12px', overflow: 'hidden', height: '220px' }}>
                    <img src={selectedSpecies.image} alt={selectedSpecies.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.82rem' }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Common Name:</span>
                      <div style={{ fontSize: '1rem', fontWeight: 'bold' }}>{selectedSpecies.name}</div>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Scientific Name:</span>
                      <div style={{ fontStyle: 'italic', fontWeight: 'bold' }}>{selectedSpecies.scientificName}</div>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Taxonomy Category:</span>
                      <div>{selectedSpecies.category}</div>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Conservation Status:</span>
                      <span style={{
                        padding: '2px 8px', borderRadius: '10px', fontSize: '0.7rem', display: 'inline-block', marginTop: '2px',
                        background: selectedSpecies.status === 'Endangered' || selectedSpecies.status === 'Critically Endangered' ? 'rgba(255,77,77,0.2)' : 'rgba(0,245,212,0.2)',
                        color: selectedSpecies.status === 'Endangered' || selectedSpecies.status === 'Critically Endangered' ? 'var(--danger)' : 'var(--success)'
                      }}>{selectedSpecies.status}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '14px', fontSize: '0.85rem' }}>
                  <div>
                    <strong>Typical Habitat:</strong>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>{selectedSpecies.habitat}</p>
                  </div>
                  <div>
                    <strong>Anthropogenic Threats:</strong>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>{selectedSpecies.threats}</p>
                  </div>
                  <div>
                    <strong>Chemical/Pollution Sensitivity Index:</strong>
                    <p style={{ color: 'var(--accent-primary)', marginTop: '2px', fontWeight: '600' }}>{selectedSpecies.sensitivity} Sensitivity</p>
                  </div>
                  <div>
                    <strong>Research Field Notes:</strong>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>{selectedSpecies.notes}</p>
                  </div>
                </div>

                <button onClick={() => setSelectedSpecies(null)} className="btn btn-secondary" style={{ width: '100%' }}>Close Profile</button>
              </div>
            </div>
          )}

        </div>
      )}

      {/* =========================================================================
          TAB 4: BIODIVERSITY HOTSPOTS
          ========================================================================= */}
      {activeTab === 'biodiversity-hotspots' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '10px' }}>Coastal Biodiversity Hotspot Zones</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '20px' }}>
              The following zones are high-concentration ecological sectors mapped against regional pollution indices. Overlap sectors present severe threats to biodiversity.
            </p>

            <div className="table-container" style={{ marginTop: 0 }}>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Hotspot Area</th>
                    <th>Latitude</th>
                    <th>Longitude</th>
                    <th>Species Log Count</th>
                    <th>Pollution Risk Index</th>
                    <th>Dominant Threat Factor</th>
                    <th>Ecology Status</th>
                  </tr>
                </thead>
                <tbody>
                  {biodiversityHotspots.map(h => (
                    <tr key={h.id}>
                      <td><strong>{h.name}</strong></td>
                      <td>{h.lat}</td>
                      <td>{h.lng}</td>
                      <td><span style={{ color: 'var(--accent-primary)', fontWeight: 'bold' }}>{h.speciesCount} species logged</span></td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', width: '60px' }}>
                            <div style={{ height: '100%', width: `${h.riskIndex}%`, background: h.riskIndex > 60 ? 'var(--danger)' : 'var(--warning)', borderRadius: '3px' }}></div>
                          </div>
                          <strong>{h.riskIndex}%</strong>
                        </div>
                      </td>
                      <td>{h.threat}</td>
                      <td>
                        <span style={{
                          padding: '2px 8px', borderRadius: '10px', fontSize: '0.7rem',
                          background: h.riskIndex > 50 ? 'rgba(255,77,77,0.18)' : 'rgba(0,245,212,0.18)',
                          color: h.riskIndex > 50 ? 'var(--danger)' : 'var(--success)', fontWeight: '600'
                        }}>
                          {h.riskIndex > 50 ? 'Endangered Zone' : 'Stable Ecology'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '28px' }}>
            
            <div className="glass-panel" style={{ height: '350px' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '14px' }}>Biodiversity Density vs. Pollution Threats</h3>
              <ResponsiveContainer width="100%" height="85%">
                <BarChart data={biodiversityHotspots}>
                  <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={10} />
                  <YAxis stroke="var(--text-muted)" fontSize={10} />
                  <Tooltip contentStyle={{ background: '#091830', borderColor: 'var(--accent-primary)' }} />
                  <Legend />
                  <Bar dataKey="speciesCount" name="Species Sightings" fill="var(--accent-purple)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="riskIndex" name="Pollution Risk %" fill="var(--danger)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '1.1rem' }}>Ecosystem Sensitivity Assessment</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.82rem' }}>
                <div style={{ padding: '12px', background: 'rgba(255,77,77,0.06)', borderLeft: '3px solid var(--danger)', borderRadius: '4px' }}>
                  <strong>Critical Threat: Fort Kochi Estuary</strong>
                  <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Highest pollution risk index (78%) overlaps with dolphin and sea turtle feeding locations. High priority warning: microplastic density blocks filter feeders.
                  </p>
                </div>

                <div style={{ padding: '12px', background: 'rgba(255,183,3,0.06)', borderLeft: '3px solid var(--warning)', borderRadius: '4px' }}>
                  <strong>Medium Threat: Vypin Reef Zone</strong>
                  <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Risk of ghost net entanglement has increased by 14% near harbour channels. Causes damage to shallow coral reef restoration beds.
                  </p>
                </div>

                <div style={{ padding: '12px', background: 'rgba(0,245,212,0.06)', borderLeft: '3px solid var(--success)', borderRadius: '4px' }}>
                  <strong>Protected Status: Cherai Mangroves</strong>
                  <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Maintains high diversity index with lowest pollution scores. Stable carbon-sink ecosystem showing mangrove growth.
                  </p>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* =========================================================================
          TAB 5: POLLUTION VS BIODIVERSITY ANALYSIS
          ========================================================================= */}
      {activeTab === 'pollution-analysis' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          
          <div className="glass-panel" style={{ height: '400px' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '14px' }}>Temporal Trend: Water Turbidity vs. Species Sightings</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: '18px', marginTop: '-8px' }}>
              Graph maps how turbidity spikes (suspended sediment/waste runoff) correlate directly with a decline in marine species observations.
            </p>
            <ResponsiveContainer width="100%" height="75%">
              <AreaChart data={simulatedSensorHistory}>
                <defs>
                  <linearGradient id="colorTurbidity" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--danger)" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="var(--danger)" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorPH" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="var(--text-muted)" />
                <YAxis stroke="var(--text-muted)" />
                <Tooltip contentStyle={{ background: '#091830', borderColor: 'var(--accent-primary)' }} />
                <Legend />
                <Area type="monotone" dataKey="turbidity" name="Turbidity (NTU)" stroke="var(--danger)" fillOpacity={1} fill="url(#colorTurbidity)" />
                <Area type="monotone" dataKey="ph" name="Water pH" stroke="var(--accent-primary)" fillOpacity={1} fill="url(#colorPH)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '28px' }}>
            
            <div className="glass-panel" style={{ height: '350px' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '14px' }}>Sightings Count by Pollution Severity Area</h3>
              <ResponsiveContainer width="100%" height="80%">
                <BarChart data={[
                  { severity: 'Low Pollution', speciesLogged: 34, index: 85 },
                  { severity: 'Medium Pollution', speciesLogged: 19, index: 54 },
                  { severity: 'High Pollution', speciesLogged: 4, index: 12 }
                ]}>
                  <XAxis dataKey="severity" stroke="var(--text-muted)" />
                  <YAxis stroke="var(--text-muted)" />
                  <Tooltip contentStyle={{ background: '#091830', borderColor: 'var(--accent-primary)' }} />
                  <Legend />
                  <Bar dataKey="speciesLogged" name="Observed Sightings count" fill="var(--success)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="index" name="Biological Health Index %" fill="var(--accent-primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '1.1rem' }}>Correlation Analysis Details</h3>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <p>
                  <strong>Turbidity Impact:</strong> Spikes in turbidity above 20 NTU block sunlight, which triggers rapid decay of benthic algae. Sightings of Green Turtles decline by 80% within 48 hours of heavy agricultural and plastic sediment drifts.
                </p>
                <p>
                  <strong>Acidification Indicator:</strong> Seawater pH drops below 7.5 are highly correlated with industrial runoffs near the harbour mouth. This acidification decreases copepod zooplankton populations, which disrupts the marine food web.
                </p>
                <p>
                  <strong>Cleanup Effectiveness:</strong> Mapped data suggests cleanup campaigns (reducing plastic bulk by ~30%) trigger a recovery of coastal fish sightings (+15%) within two weeks in the target littoral zone.
                </p>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* =========================================================================
          TAB 6: WATER QUALITY & OCEAN CONDITIONS
          ========================================================================= */}
      {activeTab === 'water-quality' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          
          {/* Node selector */}
          <div className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>IoT Sensor Telemetry Nodes</h3>
            <select
              className="form-control"
              value={selectedDevice}
              onChange={(e) => setSelectedDevice(e.target.value)}
              style={{ width: '250px' }}
            >
              <option value="all">All Monitoring Nodes</option>
              <option value="w1">Node W1 - Fort Kochi Promenade</option>
              <option value="w2">Node W2 - Harbour Entrance Channel</option>
              <option value="w3">Node W3 - Cherai Mangrove wetlands</option>
            </select>
          </div>

          {/* Node Status Panels */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            
            {simulatedSensors.map((s, idx) => {
              if (selectedDevice !== 'all' && selectedDevice !== `w${idx + 1}`) return null;
              return (
                <div key={idx} className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ fontSize: '1rem', color: 'var(--accent-primary)' }}>{s.name}</h4>
                    <span style={{
                      padding: '2px 8px', borderRadius: '10px', fontSize: '0.65rem',
                      background: 'rgba(0, 245, 212, 0.18)', color: 'var(--success)', fontWeight: 'bold'
                    }}>
                      {s.status}
                    </span>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div style={{ padding: '10px', background: 'rgba(10,25,48,0.5)', borderRadius: '8px' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>pH Level</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: s.ph < 7.5 ? 'var(--danger)' : 'var(--success)' }}>{s.ph}</div>
                    </div>
                    <div style={{ padding: '10px', background: 'rgba(10,25,48,0.5)', borderRadius: '8px' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Turbidity</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: s.turbidity > 20 ? 'var(--danger)' : 'var(--accent-primary)' }}>{s.turbidity} NTU</div>
                    </div>
                    <div style={{ padding: '10px', background: 'rgba(10,25,48,0.5)', borderRadius: '8px' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Water Temp</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#ffffff' }}>{s.temp}°C</div>
                    </div>
                    <div style={{ padding: '10px', background: 'rgba(10,25,48,0.5)', borderRadius: '8px' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Condition</div>
                      <div style={{ fontSize: '1rem', fontWeight: 'bold', color: s.ph >= 7.5 && s.turbidity <= 15 ? 'var(--success)' : 'var(--warning)', marginTop: '4px' }}>
                        {s.ph >= 7.5 && s.turbidity <= 15 ? 'Excellent' : 'Degraded'}
                      </div>
                    </div>
                  </div>

                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '10px' }}>
                    Installed: August 2026 • Real-time 15 min telemetry
                  </div>
                </div>
              );
            })}

          </div>

          {/* Historical Trends charts */}
          <div className="glass-panel" style={{ height: '380px' }}>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '18px' }}>24-Hour Telemetry Historical Drift</h3>
            <ResponsiveContainer width="100%" height="80%">
              <LineChart data={simulatedSensorHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" stroke="var(--text-muted)" />
                <YAxis stroke="var(--text-muted)" />
                <Tooltip contentStyle={{ background: '#091830', borderColor: 'var(--accent-primary)' }} />
                <Legend />
                <Line type="monotone" dataKey="ph" name="pH Value" stroke="var(--success)" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="turbidity" name="Turbidity (NTU)" stroke="var(--danger)" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="temp" name="Temperature (°C)" stroke="var(--accent-primary)" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

        </div>
      )}

      {/* =========================================================================
          TAB 7: RESEARCH PROJECTS
          ========================================================================= */}
      {activeTab === 'research-projects' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700' }}>Active Research Projects</h3>
            <button className="btn btn-primary" onClick={() => setShowProjectModal(true)}>
              <Plus size={16} /> Launch New Project
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
            
            {projects.length > 0 ? (
              projects.map(p => (
                <div key={p.project_id} className="glass-panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '240px' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span style={{ padding: '2px 8px', borderRadius: '8px', fontSize: '0.65rem', background: 'rgba(0, 229, 255, 0.15)', color: 'var(--accent-primary)', fontWeight: 'bold' }}>
                        {p.study_area || 'Coastal Waters'}
                      </span>
                      <button onClick={() => handleDeleteProject(p.project_id)} style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                    
                    <h4 style={{ fontSize: '1.15rem', marginTop: '10px' }}>{p.title}</h4>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '8px', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {p.description}
                    </p>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '10px', fontSize: '0.74rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>
                      Start: {p.start_date ? new Date(p.start_date).toLocaleDateString() : 'N/A'}
                    </span>
                    <span style={{ color: 'var(--text-muted)' }}>
                      PI: {p.researcher_name || user.full_name}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="glass-panel" style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                <FolderOpen size={44} style={{ opacity: 0.3, marginBottom: '12px' }} />
                <p>No research projects launched in this workspace. Launch a project to compile observations and datasets.</p>
              </div>
            )}

          </div>

          {/* New Project Modal */}
          {showProjectModal && (
            <div className="modal-overlay">
              <div className="modal-card" style={{ maxWidth: '550px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                  <h3 style={{ fontSize: '1.25rem' }}>Launch Research Project</h3>
                  <button onClick={() => setShowProjectModal(false)} style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer' }}>
                    <X size={18} />
                  </button>
                </div>
                
                <form onSubmit={handleCreateProject} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Project Title</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Impact of Microplastics on Humpback Dolphin Migration"
                      value={projectForm.title}
                      onChange={(e) => setProjectForm(prev => ({ ...prev, title: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Study Sector / Area</label>
                    <input
                      type="text"
                      className="form-control"
                      value={projectForm.study_area}
                      onChange={(e) => setProjectForm(prev => ({ ...prev, study_area: e.target.value }))}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div className="form-group">
                      <label className="form-label">Start Date</label>
                      <input
                        type="date"
                        className="form-control"
                        value={projectForm.start_date}
                        onChange={(e) => setProjectForm(prev => ({ ...prev, start_date: e.target.value }))}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">End Date</label>
                      <input
                        type="date"
                        className="form-control"
                        value={projectForm.end_date}
                        onChange={(e) => setProjectForm(prev => ({ ...prev, end_date: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Project Objectives</label>
                    <textarea
                      className="form-control"
                      rows="2"
                      placeholder="List objectives..."
                      value={projectForm.objectives}
                      onChange={(e) => setProjectForm(prev => ({ ...prev, objectives: e.target.value }))}
                    ></textarea>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Description</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      placeholder="Detailed project summary..."
                      value={projectForm.description}
                      onChange={(e) => setProjectForm(prev => ({ ...prev, description: e.target.value }))}
                    ></textarea>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Launch Project</button>
                    <button type="button" className="btn btn-secondary" onClick={() => setShowProjectModal(false)}>Cancel</button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </div>
      )}

      {/* =========================================================================
          TAB 8: MY OBSERVATIONS & AI IDENTIFICATION
          ========================================================================= */}
      {activeTab === 'my-observations' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '28px' }}>
          
          {/* Observations Recording Form */}
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700' }}>Record Biodiversity Observation</h3>
            
            {/* AI assisted analysis drop zone */}
            <div style={{
              border: '2px dashed rgba(0, 229, 255, 0.3)', padding: '20px', borderRadius: '14px',
              textAlign: 'center', background: 'rgba(10, 25, 48, 0.4)', position: 'relative'
            }}>
              <Camera size={32} style={{ color: 'var(--accent-primary)', opacity: 0.8, marginBottom: '8px' }} />
              <div style={{ fontSize: '0.85rem', fontWeight: '600' }}>AI-Assisted Species Identification</div>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '4px', marginBottom: '12px' }}>
                Upload a sighting photograph. The platform analyzer will estimate taxonomy details.
              </p>
              
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleUploadImageIdentify}
                style={{ display: 'none' }}
                accept="image/*"
              />
              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: '6px 14px', fontSize: '0.76rem' }}
                onClick={() => fileInputRef.current.click()}
              >
                Choose Photo
              </button>

              {identifying && (
                <div style={{ marginTop: '10px', fontSize: '0.76rem', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <RefreshCw size={12} className="spin-icon" /> Analyzing marine specimen details...
                </div>
              )}

              {aiResult && (
                <div style={{
                  marginTop: '12px', padding: '10px', background: 'rgba(0, 245, 212, 0.1)', border: '1px solid rgba(0, 245, 212, 0.3)',
                  borderRadius: '10px', textAlign: 'left', fontSize: '0.75rem'
                }}>
                  <div style={{ color: 'var(--success)', fontWeight: 'bold' }}>Sighting Match: {aiResult.possibleSpecies} ({aiResult.confidence}%)</div>
                  <div style={{ fontStyle: 'italic', color: 'var(--text-secondary)', marginTop: '2px' }}>Scientific: {aiResult.scientificName}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginTop: '4px' }}>Alternatives: {aiResult.alternatives.map(a => `${a.name} (${a.confidence}%)`).join(', ')}</div>
                </div>
              )}
            </div>

            <form onSubmit={handleCreateObservation} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Common Name</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Green Sea Turtle"
                    value={obsForm.species_name}
                    onChange={(e) => setObsForm(prev => ({ ...prev, species_name: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Scientific Name</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Chelonia mydas"
                    value={obsForm.scientific_name}
                    onChange={(e) => setObsForm(prev => ({ ...prev, scientific_name: e.target.value }))}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Latitude</label>
                  <input
                    type="text"
                    className="form-control"
                    value={obsForm.latitude}
                    onChange={(e) => setObsForm(prev => ({ ...prev, latitude: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Longitude</label>
                  <input
                    type="text"
                    className="form-control"
                    value={obsForm.longitude}
                    onChange={(e) => setObsForm(prev => ({ ...prev, longitude: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Observed Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={obsForm.observed_date}
                  onChange={(e) => setObsForm(prev => ({ ...prev, observed_date: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Observation Notes / Field Logs</label>
                <textarea
                  className="form-control"
                  rows="3"
                  placeholder="Behavior, health status, plastic interaction..."
                  value={obsForm.observation}
                  onChange={(e) => setObsForm(prev => ({ ...prev, observation: e.target.value }))}
                ></textarea>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Log Sighting Record</button>
            </form>
          </div>

          {/* Observations List */}
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', maxHeight: '580px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700' }}>Sighting Logs Ledger</h3>
            
            {biodiversityObs.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {biodiversityObs.map(obs => (
                  <div key={obs.record_id} style={{
                    padding: '14px', background: 'rgba(10, 25, 48, 0.6)', border: '1px solid rgba(0, 229, 255, 0.15)',
                    borderRadius: '12px', position: 'relative'
                  }}>
                    {obs.image && (
                      <div style={{
                        float: 'right', width: '50px', height: '50px', borderRadius: '8px', overflow: 'hidden',
                        marginLeft: '12px', border: '1px solid rgba(0,229,255,0.2)'
                      }}>
                        <img src={obs.image} alt={obs.species_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    )}
                    
                    <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent-primary)', fontWeight: 'bold' }}>
                      Logged Sighting
                    </span>
                    <h4 style={{ fontSize: '1rem', marginTop: '2px' }}>{obs.species_name}</h4>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>{obs.observation}</p>
                    
                    <div style={{ display: 'flex', gap: '12px', marginTop: '10px', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      <span>Area: ({obs.latitude}, {obs.longitude})</span>
                      <span>•</span>
                      <span>Date: {new Date(obs.observed_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                <Camera size={36} style={{ opacity: 0.3, marginBottom: '12px' }} />
                <p style={{ fontSize: '0.85rem' }}>No observations recorded by your account yet.</p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* =========================================================================
          TAB 9: DATASETS REPOSITORY
          ========================================================================= */}
      {activeTab === 'datasets' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '28px' }}>
            
            {/* Upload File Form */}
            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '700' }}>Connect Oceanographic Dataset</h3>
              
              <form onSubmit={handleUploadDataset} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Dataset Name</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Fort Kochi littoral plastics CSV"
                    value={datasetForm.name}
                    onChange={(e) => setDatasetForm(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Study Project Link</label>
                  <select
                    className="form-control"
                    value={datasetForm.project_id}
                    onChange={(e) => setDatasetForm(prev => ({ ...prev, project_id: e.target.value }))}
                  >
                    <option value="">No Project Link</option>
                    {projects.map(p => (
                      <option key={p.project_id} value={p.project_id}>{p.title}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Data Type</label>
                    <select
                      className="form-control"
                      value={datasetForm.data_type}
                      onChange={(e) => setDatasetForm(prev => ({ ...prev, data_type: e.target.value }))}
                    >
                      <option value="CSV">CSV Spreadsheet</option>
                      <option value="Excel">Excel Sheet</option>
                      <option value="Image">Imagery / Video</option>
                      <option value="Document">Report Document</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Data Record Count</label>
                    <input
                      type="number"
                      className="form-control"
                      value={datasetForm.record_count}
                      onChange={(e) => setDatasetForm(prev => ({ ...prev, record_count: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Sector / Location</label>
                  <input
                    type="text"
                    className="form-control"
                    value={datasetForm.location}
                    onChange={(e) => setDatasetForm(prev => ({ ...prev, location: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Dataset Description</label>
                  <textarea
                    className="form-control"
                    rows="2"
                    placeholder="Parameters recorded, sampling methods..."
                    value={datasetForm.description}
                    onChange={(e) => setDatasetForm(prev => ({ ...prev, description: e.target.value }))}
                  ></textarea>
                </div>

                <div className="form-group">
                  <label className="form-label">Select Dataset File</label>
                  <input
                    type="file"
                    ref={datasetFileInputRef}
                    onChange={(e) => setDatasetFile(e.target.files[0])}
                    className="form-control"
                    required
                  />
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                  <Upload size={16} /> Upload Dataset File
                </button>
              </form>
            </div>

            {/* Datasets list ledger */}
            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '700' }}>Datasets Vault</h3>
              
              <div className="table-container" style={{ marginTop: 0 }}>
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>File Name</th>
                      <th>Type</th>
                      <th>Records</th>
                      <th>Uploaded At</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {datasets.length > 0 ? (
                      datasets.map(d => (
                        <tr key={d.dataset_id}>
                          <td>
                            <div style={{ fontWeight: 'bold' }}>{d.name}</div>
                            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{d.file_name} ({(d.file_size / 1024).toFixed(1)} KB)</div>
                          </td>
                          <td>
                            <span style={{
                              padding: '2px 8px', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 'bold',
                              background: d.data_type === 'CSV' ? 'rgba(0, 229, 255, 0.15)' : 'rgba(157, 78, 221, 0.15)',
                              color: d.data_type === 'CSV' ? 'var(--accent-primary)' : 'var(--accent-purple)'
                            }}>{d.data_type}</span>
                          </td>
                          <td>{d.record_count}</td>
                          <td>{new Date(d.uploaded_at).toLocaleDateString()}</td>
                          <td>
                            <div style={{ display: 'flex', gap: '10px' }}>
                              <a href={d.file_url} download={d.file_name} className="btn" style={{ padding: '4px', background: 'transparent', color: 'var(--accent-primary)' }}>
                                <Download size={16} />
                              </a>
                              <button onClick={() => handleDeleteDataset(d.dataset_id)} className="btn" style={{ padding: '4px', background: 'transparent', color: 'var(--danger)' }}>
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)' }}>
                          No dataset spreadsheets connected in this catalog.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* =========================================================================
          TAB 10: RESEARCH REPORTS
          ========================================================================= */}
      {activeTab === 'research-reports' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '28px' }}>
          
          {/* Exporter form */}
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '700' }}>Compile Ecological Assessment</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '-8px' }}>
              Select assessment boundary parameters. The compiler will structure telemetry, maps, and observations into a printable file.
            </p>

            <form onSubmit={handleGenerateReport} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Report Title</label>
                <input
                  type="text"
                  className="form-control"
                  value={reportForm.title}
                  onChange={(e) => setReportForm(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Study boundary / Area</label>
                <input
                  type="text"
                  className="form-control"
                  value={reportForm.study_area}
                  onChange={(e) => setReportForm(prev => ({ ...prev, study_area: e.target.value }))}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Analysis Start Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={reportForm.start_date}
                    onChange={(e) => setReportForm(prev => ({ ...prev, start_date: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Analysis End Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={reportForm.end_date}
                    onChange={(e) => setReportForm(prev => ({ ...prev, end_date: e.target.value }))}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Assessment Findings & Recommendations</label>
                <textarea
                  className="form-control"
                  rows="4"
                  value={reportForm.findings}
                  onChange={(e) => setReportForm(prev => ({ ...prev, findings: e.target.value }))}
                ></textarea>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                <FileText size={16} /> Compile and Preview Report
              </button>
            </form>
          </div>

          {/* Report Preview */}
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px', minHeight: '500px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '700' }}>Document Preview</h3>
            
            {generatedReport ? (
              <div style={{
                background: '#ffffff', color: '#090f1d', padding: '30px', borderRadius: '12px',
                flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: 'inset 0 0 10px rgba(0,0,0,0.15)'
              }}>
                <div>
                  {/* Header */}
                  <div style={{ borderBottom: '2px solid #0284c7', paddingBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h2 style={{ color: '#0284c7', fontSize: '1.3rem', fontWeight: 'bold' }}>TerraMarine EcoSystem Report</h2>
                      <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>Coastal Research & Marine Intelligence Workspace</div>
                    </div>
                    <span style={{ fontSize: '0.7rem', background: '#e0f2fe', color: '#0369a1', padding: '3px 10px', borderRadius: '20px', fontWeight: 'bold' }}>
                      Status: Compiled
                    </span>
                  </div>

                  {/* Body info */}
                  <div style={{ marginTop: '20px', fontSize: '0.8rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                      <span>Assessment Sector: <strong>{generatedReport.study_area}</strong></span>
                      <span>Prepared By: <strong>{generatedReport.researcher_name || user.full_name}</strong></span>
                      <span>Start Boundary: <strong>{new Date(generatedReport.start_date).toLocaleDateString()}</strong></span>
                      <span>End Boundary: <strong>{new Date(generatedReport.end_date).toLocaleDateString()}</strong></span>
                    </div>

                    <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '14px' }}>
                      <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 'bold' }}>Core Findings:</span>
                      <p style={{ marginTop: '6px', color: '#334155', lineHeight: 1.45, fontSize: '0.78rem' }}>
                        {generatedReport.findings}
                      </p>
                    </div>

                    <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '14px', marginTop: '14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div style={{ padding: '8px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <span style={{ fontSize: '0.65rem', color: '#64748b' }}>Connected Datasets:</span>
                        <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#0284c7' }}>{generatedReport.parameters?.datasetCount} connected</div>
                      </div>
                      <div style={{ padding: '8px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <span style={{ fontSize: '0.65rem', color: '#64748b' }}>Biodiversity Logs:</span>
                        <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#9d4edd' }}>{generatedReport.parameters?.observationsCount} logged</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '14px', display: 'flex', gap: '10px' }}>
                  <button onClick={() => window.print()} className="btn btn-primary" style={{ flex: 1, padding: '8px', fontSize: '0.8rem' }}>
                    <Download size={14} /> Download PDF
                  </button>
                  <button onClick={() => setGeneratedReport(null)} className="btn btn-secondary" style={{ flex: 1, padding: '8px', fontSize: '0.8rem', border: '1px solid #cbd5e1', color: '#334155' }}>
                    Reset Preview
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '350px', color: 'var(--text-secondary)' }}>
                <FileText size={44} style={{ opacity: 0.3, marginBottom: '12px' }} />
                <p style={{ fontSize: '0.85rem' }}>Configure parameters and click compile to preview the PDF print document.</p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* =========================================================================
          TAB 11: RESEARCH ASSISTANT
          ========================================================================= */}
      {activeTab === 'research-assistant' && (
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '580px', padding: '20px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px', marginBottom: '14px' }}>
            <Sparkles size={20} style={{ color: 'var(--accent-primary)' }} />
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>AI Assistant - TerraMarine Intelligence</h3>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Analyzes live platform DB stats, sensor metrics & biodiversity logs.</div>
            </div>
          </div>

          {/* Chat Messages Frame */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px', paddingRight: '6px', marginBottom: '14px' }}>
            {chatMessages.map((msg, idx) => (
              <div key={idx} style={{
                alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%', padding: '12px 16px', borderRadius: '14px',
                background: msg.sender === 'user' ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' : 'rgba(10, 25, 48, 0.65)',
                border: msg.sender === 'user' ? '1px solid rgba(0,229,255,0.3)' : '1px solid rgba(255,255,255,0.08)',
                color: '#ffffff', fontSize: '0.85rem', whiteSpace: 'pre-wrap'
              }}>
                {msg.text}
              </div>
            ))}
            
            {chatLoading && (
              <div style={{
                alignSelf: 'flex-start', background: 'rgba(10, 25, 48, 0.65)', border: '1px solid rgba(255,255,255,0.08)',
                padding: '12px 16px', borderRadius: '14px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px'
              }}>
                <RefreshCw size={12} className="spin-icon" /> AI Assistant is formulating response using live query structures...
              </div>
            )}
            
            <div ref={chatEndRef}></div>
          </div>

          {/* Chat Input form */}
          <form onSubmit={handleSendChatMessage} style={{ display: 'flex', gap: '12px' }}>
            <input
              type="text"
              className="form-control"
              placeholder="Ask Assistant: 'Compare pH averages' or 'What species were observed near Kochi?'"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              disabled={chatLoading}
              style={{ flex: 1 }}
            />
            <button type="submit" className="btn btn-primary" style={{ padding: '12px 20px' }} disabled={chatLoading}>
              <Send size={16} /> Send
            </button>
          </form>

        </div>
      )}

      {/* =========================================================================
          TAB 12: RESEARCH ALERTS CENTER
          ========================================================================= */}
      {activeTab === 'research-alerts' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '28px' }}>
          
          {/* Create Alert Rules Form */}
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '700' }}>Setup Threshold Trigger</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '-8px' }}>
              Create active ecological thresholds. When sensor readings or reports cross rules, warning items are generated automatically.
            </p>

            <form onSubmit={handleCreateAlertRule} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Alert Type Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={alertRuleForm.alert_type}
                  onChange={(e) => setAlertRuleForm(prev => ({ ...prev, alert_type: e.target.value }))}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Telemetry Parameter</label>
                  <select
                    className="form-control"
                    value={alertRuleForm.parameter_name}
                    onChange={(e) => setAlertRuleForm(prev => ({ ...prev, parameter_name: e.target.value }))}
                  >
                    <option value="turbidity">Water Turbidity (NTU)</option>
                    <option value="ph">Water pH Level</option>
                    <option value="temperature">Water Temp (°C)</option>
                    <option value="bin_fill_level">Smart Bin Fill Level %</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Operator</label>
                  <select
                    className="form-control"
                    value={alertRuleForm.comparison_operator}
                    onChange={(e) => setAlertRuleForm(prev => ({ ...prev, comparison_operator: e.target.value }))}
                  >
                    <option value=">">&gt; Greater than</option>
                    <option value="<">&lt; Less than</option>
                    <option value="=">= Equals</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Threshold Limit Value</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    value={alertRuleForm.threshold_value}
                    onChange={(e) => setAlertRuleForm(prev => ({ ...prev, threshold_value: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Severity</label>
                  <select
                    className="form-control"
                    value={alertRuleForm.severity}
                    onChange={(e) => setAlertRuleForm(prev => ({ ...prev, severity: e.target.value }))}
                  >
                    <option value="Low">Low Alert</option>
                    <option value="Medium">Medium Warning</option>
                    <option value="High">Critical Danger</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Sensing location / Boundary</label>
                <input
                  type="text"
                  className="form-control"
                  value={alertRuleForm.location}
                  onChange={(e) => setAlertRuleForm(prev => ({ ...prev, location: e.target.value }))}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                <Plus size={16} /> Deploy Alert Rule Trigger
              </button>
            </form>
          </div>

          {/* Trigger rules ledger */}
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '700' }}>Active Alert Rules Ledger</h3>
            
            <div className="table-container" style={{ marginTop: 0 }}>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Rule Trigger</th>
                    <th>Threshold Statement</th>
                    <th>Location Scope</th>
                    <th>Severity</th>
                    <th>Telemetry Trigger</th>
                    <th>Remove</th>
                  </tr>
                </thead>
                <tbody>
                  {researchAlertRules.length > 0 ? (
                    researchAlertRules.map(rule => (
                      <tr key={rule.alert_id}>
                        <td><strong>{rule.alert_type}</strong></td>
                        <td style={{ fontFamily: 'monospace', color: 'var(--accent-primary)' }}>
                          {rule.parameter_name} {rule.comparison_operator} {rule.threshold_value}
                        </td>
                        <td>{rule.location || 'All Sectors'}</td>
                        <td>
                          <span style={{
                            padding: '2px 8px', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 'bold',
                            background: rule.severity === 'High' ? 'rgba(255, 77, 77, 0.18)' : 'rgba(255, 183, 3, 0.18)',
                            color: rule.severity === 'High' ? 'var(--danger)' : 'var(--warning)'
                          }}>{rule.severity}</span>
                        </td>
                        <td>
                          <button
                            onClick={() => handleToggleAlertRule(rule.alert_id, rule.is_active)}
                            className="btn"
                            style={{
                              padding: '4px 10px', borderRadius: '6px', fontSize: '0.7rem',
                              background: rule.is_active ? 'rgba(0, 245, 212, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                              color: rule.is_active ? 'var(--success)' : 'var(--text-muted)'
                            }}
                          >
                            {rule.is_active ? 'Active Sentinel' : 'Deactivated'}
                          </button>
                        </td>
                        <td>
                          <button onClick={() => handleDeleteAlertRule(rule.alert_id)} className="btn" style={{ padding: '4px', background: 'transparent', color: 'var(--danger)' }}>
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)' }}>
                        No customized ecological triggers created.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};

export default ResearcherDashboard;
