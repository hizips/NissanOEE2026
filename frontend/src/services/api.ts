const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

/**
 * Helper function for fetch to handle JSON parsing and errors.
 */
async function fetchClient(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const token = sessionStorage.getItem('oee-auth-token');
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers as Record<string, string>,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, { ...options, headers });
  
  if (!response.ok) {
    const errorBody = await response.text();
    // If unauthorized, could automatically log out the user here
    if (response.status === 401) {
      sessionStorage.removeItem('oee-auth-token');
      sessionStorage.removeItem('oee-authenticated');
      // window.location.reload(); // Optional: force reload to login screen
    }
    throw new Error(`API Request Failed: ${response.status} ${response.statusText} - ${errorBody}`);
  }
  
  if (response.status === 204) {
    return null;
  }
  
  return response.json();
}

/**
 * Authentication API Endpoints
 */
export const authApi = {
  login: (credentials: any) => fetchClient('/auth/login/', {
    method: 'POST',
    body: JSON.stringify(credentials),
  })
};

/**
 * Generic API Factory
 */
const mapPayloadForBackend = (data: any) => {
  if (!data || typeof data !== 'object') return data;
  const mapped = { ...data };
  
  if ('machineId' in mapped) mapped.machine = mapped.machineId;
  if ('partId' in mapped) mapped.part = mapped.partId;
  
  // Flatten downtime reason for backend
  if (mapped.reason && typeof mapped.reason === 'object') {
    mapped.reasonCategory = mapped.reason.category || '';
    mapped.reasonSubsystem = mapped.reason.subsystem || null;
    mapped.reasonComponent = mapped.reason.component || null;
    mapped.reasonSpecificItem = mapped.reason.specificItem || null;
    mapped.reasonFullPath = mapped.reason.fullPath || mapped.reason.category || '';
    delete mapped.reason;
  }
  
  return mapped;
};

const mapResponseForFrontend = (data: any) => {
  if (!data || typeof data !== 'object') return data;
  const mapped = { ...data };
  
  // Map backend relationship fields back to frontend ID fields
  if ('machine' in mapped && mapped.machine !== undefined) {
    mapped.machineId = String(mapped.machine);
    // don't delete mapped.machine, in case it's used elsewhere
  }
  if ('part' in mapped && mapped.part !== undefined) {
    mapped.partId = mapped.part ? String(mapped.part) : undefined;
  }
  
  // Restore nested downtime reason for frontend
  if ('reasonCategory' in mapped) {
    mapped.reason = {
      category: mapped.reasonCategory,
      subsystem: mapped.reasonSubsystem,
      component: mapped.reasonComponent,
      specificItem: mapped.reasonSpecificItem,
      fullPath: mapped.reasonFullPath || mapped.reasonCategory,
    };
  }
  
  return mapped;
};

const createCrudApi = (baseEndpoint: string) => ({
  getAll: async () => {
    const res = await fetchClient(baseEndpoint);
    return Array.isArray(res) ? res.map(mapResponseForFrontend) : res;
  },
  getById: async (id: string | number) => {
    const res = await fetchClient(`${baseEndpoint}${id}/`);
    return mapResponseForFrontend(res);
  },
  create: async (data: any) => {
    const res = await fetchClient(baseEndpoint, {
      method: 'POST',
      body: JSON.stringify(mapPayloadForBackend(data)),
    });
    return mapResponseForFrontend(res);
  },
  update: async (id: string | number, data: any) => {
    const res = await fetchClient(`${baseEndpoint}${id}/`, {
      method: 'PUT',
      body: JSON.stringify(mapPayloadForBackend(data)),
    });
    return mapResponseForFrontend(res);
  },
  patch: async (id: string | number, data: any) => {
    const res = await fetchClient(`${baseEndpoint}${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(mapPayloadForBackend(data)),
    });
    return mapResponseForFrontend(res);
  },
  delete: (id: string | number) => fetchClient(`${baseEndpoint}${id}/`, {
    method: 'DELETE',
  }),
});

export const machineApi = createCrudApi('/machines/');
export const operatorApi = createCrudApi('/operators/');
export const partApi = createCrudApi('/parts/');
export const defectReasonApi = createCrudApi('/defect-reasons/');
export const downtimeReasonApi = createCrudApi('/downtime-reasons/');
export const processReasonApi = createCrudApi('/process-reasons/');
export const scheduledDowntimeApi = createCrudApi('/scheduled-downtimes/');
export const partProductionHistoryApi = createCrudApi('/part-production-history/');
export const downtimeEventHistoryApi = createCrudApi('/downtime-event-history/');
export const productionRecordApi = createCrudApi('/records/');
