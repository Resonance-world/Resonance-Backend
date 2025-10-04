import { MatchSocketService } from './match-socket.service.js';
// Create a singleton instance that's available immediately
const matchSocketService = new MatchSocketService();
// Make it globally available
global.matchSocketService = matchSocketService;
export { matchSocketService };
//# sourceMappingURL=match-socket-service-singleton.js.map