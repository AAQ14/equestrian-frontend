import api, { getList } from './axiosInstance';

// Every backend endpoint the app uses, grouped by feature.
// Each function returns the response data (or a list), so pages never deal with axios directly.

const data = (promise) => promise.then((res) => res.data);

// ---------- Riding sessions ----------
export const sessionsApi = {
  list: () => getList('/api/sessions'),
  get: (id) => data(api.get(`/api/sessions/${id}`)),
  // Body: { instructorId, date, startTime, endTime, price, skillLevel, capacity }
  create: (body) => data(api.post('/api/sessions/create', body)),
  update: (id, body) => data(api.put(`/api/sessions/${id}`, body)),
  cancel: (id) => data(api.patch(`/api/sessions/${id}/cancel`)),
};

// ---------- Bookings ----------
export const bookingsApi = {
  // Clients get their own bookings; instructors and admins get all bookings.
  list: (status) => getList('/api/bookings', { params: status ? { status } : {} }),
  // Body: { ridingSessionId } or, for instructors, { ridingSessionId, userId }
  create: (body) => data(api.post('/api/bookings', body)),
  // bookingStatus: CONFIRMED | COMPLETED | CANCELLED
  changeStatus: (id, bookingStatus) => data(api.put(`/api/bookings/${id}`, { bookingStatus })),
};

// ---------- Horse assignment of a booking ----------
export const horseAssignmentApi = {
  // Returns null when the booking has no horse yet (the backend answers 404).
  get: async (bookingId) => {
    try {
      return await data(api.get(`/api/bookings/${bookingId}/horseAssignments`));
    } catch (error) {
      if (error.response?.status === 404) return null;
      throw error;
    }
  },
  assign: (bookingId, horseId) => data(api.post(`/api/bookings/${bookingId}/horseAssignments`, { horseId })),
  // Note: this backend path ends with a slash.
  change: (bookingId, horseId) => data(api.patch(`/api/bookings/${bookingId}/horseAssignments/`, { horseId })),
  remove: (bookingId) => api.delete(`/api/bookings/${bookingId}/horseAssignments`),
};

// ---------- Horses ----------
export const horsesApi = {
  list: () => getList('/api/horses/all'),
  // Horses are sent as multipart form data, because they can include an image file.
  create: (formData) => data(api.post('/api/horses/create', formData, { headers: { 'Content-Type': 'multipart/form-data' } })),
  update: (id, formData) =>
    data(api.put(`/api/horses/update/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })),
  remove: (id) => data(api.delete(`/api/horses/delete/${id}`)),
};

// ---------- Instructors ----------
export const instructorsApi = {
  list: () => getList('/api/instructors'),
  // Body: { userId, specialization, experienceYears, skillLevel }
  create: (body) => data(api.post('/api/instructors/create', body)),
  update: (id, body) => data(api.put(`/api/instructors/${id}`, body)),
  remove: (id) => data(api.delete(`/api/instructors/${id}`)),
};

// ---------- Tournaments and seats ----------
export const tournamentsApi = {
  list: () => getList('/api/tournaments'),
  get: (id) => data(api.get(`/api/tournaments/${id}`)),
  create: (body) => data(api.post('/api/tournaments', body)),
  update: (id, body) => data(api.patch(`/api/tournaments/${id}`, body)),
  cancel: (id) => data(api.patch(`/api/tournaments/${id}/cancel`)),
  // [{ id, tournamentId, tournamentName, seatNumber, seatStatus, price }]
  seats: (id) => getList(`/api/seats/${id}`),
};

// ---------- Tickets ----------
export const ticketsApi = {
  // May take a few seconds: the server locks the seat while buying.
  buy: (tournamentId, seatId, config) => data(api.post(`/api/tickets/${tournamentId}`, { seatId }, config)),
  my: () => getList('/api/tickets/my'),
  all: () => getList('/api/tickets'),
  cancelMine: (id) => data(api.put(`/api/tickets/${id}/cancel/my`)),
  cancelAsAdmin: (id) => data(api.patch(`/api/tickets/${id}/cancel`)),
  changeSeat: (id, seatId) => data(api.patch(`/api/tickets/${id}/update/my`, { seatId })),
};

// ---------- Users (admin) ----------
export const usersApi = {
  list: (userStatus) => getList('/api/users', { params: userStatus ? { userStatus } : {} }),
  deactivate: (id) => data(api.delete(`/api/users/${id}`)),
  activate: (id) => data(api.put(`/api/users/${id}/activate`)),
};

// ---------- Notifications and audit log ----------
export const notificationsApi = {
  list: () => getList('/api/notifications'),
};

export const auditLogsApi = {
  list: () => getList('/api/audit-logs'),
};
