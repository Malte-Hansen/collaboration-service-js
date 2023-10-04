import * as request from 'supertest';

const host = process.env.NEST_HOST || 'localhost';
const port = process.env.NEST_PORT || '4444';
const baseURL = 'http://' + host + ':' + port;

describe('e2e', () => {
    const apiRequest = request(baseURL);

    it('create room', async () => {
        const response = await apiRequest.get('/rooms');
        expect(response.status).toBe(200);
        expect(response.body).toStrictEqual([]);
    });
    
});