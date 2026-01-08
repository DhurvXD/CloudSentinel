const API_BASE_URL = "http://127.0.0.1:5000/api"

interface AuthResponse {
  success: boolean
  message: string
  access_token?: string
  user?: {
    username: string
    email: string
    role: string
  }
}

interface FileResponse {
  success: boolean
  message: string
  file_id?: string
  files?: any[]
}

interface AuditResponse {
  success: boolean
  logs?: any[]
  report?: string
}

export const api = {
  auth: {
    register: async (username: string, email: string, password: string): Promise<AuthResponse> => {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Registration failed")
      }

      return data
    },

    login: async (username: string, password: string): Promise<{ token: string; user: any }> => {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Login failed")
      }

      // Return the token and user from the response
      return {
        token: data.access_token,
        user: data.user,
      }
    },

    me: async (token: string) => {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to get user info")
      }

      return data.user
    },
  },

  files: {
    upload: async (token: string, formData: FormData): Promise<FileResponse> => {
      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Upload failed")
      }

      return data
    },

    list: async (token: string): Promise<any[]> => {
      const response = await fetch(`${API_BASE_URL}/files`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch files")
      }

      // Return the files array from the response
      return data.files ? Object.values(data.files) : []
    },

    myFiles: async (token: string): Promise<any[]> => {
      const response = await fetch(`${API_BASE_URL}/files/my`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch files")
      }

      // Return the files array from the response
      return data.files ? Object.values(data.files) : []
    },

    download: async (token: string, fileId: string, password: string): Promise<Blob> => {
      const response = await fetch(`${API_BASE_URL}/download/${fileId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || "Download failed")
      }

      return await response.blob()
    },

    share: async (token: string, fileId: string, shareData: any): Promise<FileResponse> => {
      const response = await fetch(`${API_BASE_URL}/files/${fileId}/share`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(shareData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to update permissions")
      }

      return data
    },

    delete: async (token: string, fileId: string): Promise<FileResponse> => {
      const response = await fetch(`${API_BASE_URL}/files/${fileId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Delete failed")
      }

      return data
    },
  },

  audit: {
    me: async (token: string): Promise<any[]> => {
      const response = await fetch(`${API_BASE_URL}/audit/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch audit logs")
      }

      // Map the logs to include an id field
      return (data.logs || []).map((log: any, index: number) => ({
        id: `${index}`,
        type: log.event_type,
        action: log.event_type,
        description: log.details?.action || log.event_type,
        timestamp: log.timestamp,
        ip_address: log.ip_address,
        success: log.success,
        user_id: log.username,
      }))
    },

    file: async (token: string, fileId: string): Promise<any[]> => {
      const response = await fetch(`${API_BASE_URL}/audit/file/${fileId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch file audit logs")
      }

      return data.logs || []
    },

    report: async (token: string): Promise<any> => {
      const response = await fetch(`${API_BASE_URL}/audit/report`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch report")
      }

      // Return a mock report structure if backend doesn't provide it
      return {
        total_events: 0,
        successful_operations: 0,
        failed_operations: 0,
        access_denials: 0,
        failed_logins: 0,
      }
    },
  },
}