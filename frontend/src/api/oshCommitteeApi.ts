import axiosInstance from './axiosInstance'
import { ApiResponse, PageResponse } from '../types/common.types'
import { OSHCommittee, OSHCommitteeRequest } from '../types/oshCommittee.types'

interface SearchParams {
  page: number
  size: number
  year?: number
  quarter?: string
}

export const oshCommitteeApi = {
  search: async (params: SearchParams): Promise<PageResponse<OSHCommittee>> => {
    const { page, size, year, quarter } = params
    let url = '/osh-committees'
    const queryParams = new URLSearchParams()
    queryParams.append('page', String(page))
    queryParams.append('size', String(size))

    if (year && quarter && quarter !== '전체') {
      url = `/osh-committees/year/${year}/quarter/${quarter.replace('분기', '')}`
    } else if (year) {
      url = `/osh-committees/year/${year}`
    }

    const res = await axiosInstance.get<ApiResponse<PageResponse<OSHCommittee>>>(`${url}?${queryParams.toString()}`)
    return res.data.data
  },

  getById: async (id: number): Promise<OSHCommittee> => {
    const res = await axiosInstance.get<ApiResponse<OSHCommittee>>(`/osh-committees/${id}`)
    return res.data.data
  },

  create: async (data: OSHCommitteeRequest): Promise<OSHCommittee> => {
    const res = await axiosInstance.post<ApiResponse<OSHCommittee>>('/osh-committees', data)
    return res.data.data
  },

  update: async (id: number, data: OSHCommitteeRequest): Promise<OSHCommittee> => {
    const res = await axiosInstance.put<ApiResponse<OSHCommittee>>(`/osh-committees/${id}`, data)
    return res.data.data
  },

  delete: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/osh-committees/${id}`)
  },

  addAttendeesBulk: async (committeeId: number, attendees: unknown[]): Promise<void> => {
    await axiosInstance.post(`/osh-committees/${committeeId}/attendees/bulk`, attendees)
  },

  deleteAttendee: async (committeeId: number, attendeeId: number): Promise<void> => {
    await axiosInstance.delete(`/osh-committees/${committeeId}/attendees/${attendeeId}`)
  },

  updateAttendeeSignature: async (committeeId: number, attendeeId: number, signatureImage: string): Promise<void> => {
    await axiosInstance.patch(`/osh-committees/${committeeId}/attendees/${attendeeId}/signature`, { signatureImage })
  },

  sendSignLinks: async (committeeId: number): Promise<string> => {
    const res = await axiosInstance.post(`/osh-committees/${committeeId}/send-sign-links`)
    return res.data.message || '서명 링크를 발송했습니다.'
  },
}
