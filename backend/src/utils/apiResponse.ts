import { Response } from 'express';

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export const apiResponse = {
  success(res: Response, data: unknown, statusCode = 200): Response {
    return res.status(statusCode).json({
      success: true,
      data,
    });
  },

  created(res: Response, data: unknown): Response {
    return res.status(201).json({
      success: true,
      data,
    });
  },

  paginated(res: Response, data: unknown, meta: PaginationMeta): Response {
    return res.status(200).json({
      success: true,
      data,
      meta,
    });
  },

  noContent(res: Response): Response {
    return res.status(204).send();
  },
};
