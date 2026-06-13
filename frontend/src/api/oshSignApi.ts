import axios from 'axios'

const BASE = (import.meta as any).env?.VITE_API_URL || '/api'

export interface OshSignInfo {
  attendeeId: number
  attendeeName: string
  committeeId: number
  oshYear: number
  oshQuarter: number
  oshDate: string
  mainAgenda: string
  alreadySigned: boolean
  signatureImage?: string
}

export const oshSignApi = {
  getInfo: async (token: string): Promise<OshSignInfo> => {
    const res = await axios.get(`${BASE}/osh-sign/${token}`)
    return res.data.data
  },

  submitSignature: async (token: string, signatureImage: string): Promise<void> => {
    await axios.post(`${BASE}/osh-sign/${token}/signature`, { signatureImage })
  },
}
