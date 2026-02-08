import { describe, it, expect, beforeEach, jest, beforeAll } from '@jest/globals';
import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authenticateToken } from '../../middleware/auth.js';
import { AuthenticatedRequest } from '../../types/index.js';

// Mock functions
const mockStatus = jest.fn();
const mockJson = jest.fn();
const mockNext = jest.fn();

describe('Auth Middleware', () => {
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;
  const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';

  // Increase timeout for async callback tests
  beforeAll(() => {
    jest.setTimeout(10000);
  });

  beforeEach(() => {
    mockStatus.mockReturnValue({ json: mockJson });
    mockJson.mockReturnValue({});
    mockNext.mockClear();
    mockStatus.mockClear();
    mockJson.mockClear();

    mockRequest = {
      headers: {},
    };
    mockResponse = {
      status: mockStatus as unknown as Response['status'],
      json: mockJson as unknown as Response['json'],
    };
    nextFunction = mockNext as NextFunction;
  });

  it('should return 401 when no token is provided', () => {
    mockRequest.headers = {};

    authenticateToken(
      mockRequest as AuthenticatedRequest,
      mockResponse as Response,
      nextFunction
    );

    expect(mockStatus).toHaveBeenCalledWith(401);
    expect(mockJson).toHaveBeenCalledWith({
      error: 'Access token required',
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 401 when authorization header is missing', () => {
    mockRequest.headers = {};

    authenticateToken(
      mockRequest as AuthenticatedRequest,
      mockResponse as Response,
      nextFunction
    );

    expect(mockStatus).toHaveBeenCalledWith(401);
    expect(mockJson).toHaveBeenCalledWith({
      error: 'Access token required',
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 403 when token is invalid', (done) => {
    mockRequest.headers = {
      authorization: 'Bearer invalid-token',
    };

    authenticateToken(
      mockRequest as AuthenticatedRequest,
      mockResponse as Response,
      nextFunction
    );

    // jwt.verify is asynchronous, poll until callback is executed
    const checkCallback = () => {
      if (mockStatus.mock.calls.length > 0 || mockNext.mock.calls.length > 0) {
        try {
          expect(mockStatus).toHaveBeenCalledWith(403);
          expect(mockJson).toHaveBeenCalledWith({
            error: 'Invalid or expired token',
          });
          expect(mockNext).not.toHaveBeenCalled();
          done();
        } catch (error) {
          done(error instanceof Error ? error : new Error(String(error)));
        }
      } else {
        setTimeout(checkCallback, 10);
      }
    };

    // Start checking after a small delay
    setTimeout(checkCallback, 10);
  });

  it('should return 403 when token is expired', (done) => {
    const expiredToken = jwt.sign(
      { userId: 1, email: 'test@example.com' },
      JWT_SECRET,
      { expiresIn: '-1h' }
    );

    mockRequest.headers = {
      authorization: `Bearer ${expiredToken}`,
    };

    authenticateToken(
      mockRequest as AuthenticatedRequest,
      mockResponse as Response,
      nextFunction
    );

    // jwt.verify is asynchronous, poll until callback is executed
    const checkCallback = () => {
      if (mockStatus.mock.calls.length > 0 || mockNext.mock.calls.length > 0) {
        try {
          expect(mockStatus).toHaveBeenCalledWith(403);
          expect(mockJson).toHaveBeenCalledWith({
            error: 'Invalid or expired token',
          });
          expect(mockNext).not.toHaveBeenCalled();
          done();
        } catch (error) {
          done(error instanceof Error ? error : new Error(String(error)));
        }
      } else {
        setTimeout(checkCallback, 10);
      }
    };

    // Start checking after a small delay
    setTimeout(checkCallback, 10);
  });
});

