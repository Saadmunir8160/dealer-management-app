/**
 * Coverage areas exist only on UCIC API.
 * DealerManagement.Api has no CoverageArea controller — stub keeps imports compiling.
 */
export const coverageAreaApi = {
  getAll: async (_page = 1, _pageSize = 50) => ({
    data: {
      success: true,
      message: '',
      data: [] as unknown[],
      metadata: {
        currentPage: 1,
        pageSize: 50,
        totalCount: 0,
        totalPages: 0,
      },
    },
  }),
};
