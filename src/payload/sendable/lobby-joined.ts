export type LobbyJoinedResponse = {
  ticketId: string;
  validUntil: number;
};

export function isLobbyJoinedResponse(
  response: any,
): response is LobbyJoinedResponse {
  return (
    response !== null &&
    typeof response === 'object' &&
    typeof response.ticketId === 'string' &&
    typeof response.validUntil === 'number'
  );
}
