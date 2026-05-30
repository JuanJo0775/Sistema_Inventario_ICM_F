import type { DashboardOverview } from '../interfaces/dashboard'
import { useMocks } from '../mocks/config'
import { mockDashboardOverview } from '../mocks/dashboard'

export const fetchDashboardOverview = async (): Promise<DashboardOverview> => {
  if (useMocks) {
    return mockDashboardOverview
  }
  return mockDashboardOverview
}
