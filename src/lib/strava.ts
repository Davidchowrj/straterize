const STRAVA_BASE_URL = "https://www.strava.com/api/v3";

export type StravaAthelete = {
  id: number;
  firstName: string;
  lastName: string;
  profile: string;
  city: string;
  country: string;
};

export type StravaTokenResponse = {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  athlete: StravaAthelete;
};

type TokenAccessor = {
  getToken: () => Promise<{
    accessToken: string;
    expiresAt: number;
    refreshToken: string;
  }>;
  updateToken: (t: {
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
  }) => Promise<void>;
};

export const exchangeToken = async (
  code: string,
): Promise<StravaTokenResponse> => {
  const response = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to exchange token: ${response.statusText}`);
  }

  return response.json();
};

export const refreshAccessToken = async (
  refereshToken: string,
): Promise<StravaTokenResponse> => {
  const response = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      refresh_token: refereshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to refresh access token: ${response.statusText}`);
  }

  return response.json();
};

export const stravaFetch = async <T>(
  endpoint: string,
  { getToken, updateToken }: TokenAccessor,
): Promise<T> => {
  let token = await getToken();

  // Refreshes within 5 mins
  if (Date.now() / 1000 > token.expiresAt - 300) {
    const refreshed = await refreshAccessToken(token.refreshToken);
    await updateToken({
      accessToken: refreshed.access_token,
      refreshToken: refreshed.refresh_token,
      expiresAt: refreshed.expires_at,
    });
    token = {
      accessToken: refreshed.access_token,
      refreshToken: refreshed.refresh_token,
      expiresAt: refreshed.expires_at,
    };
  }

  const response = await fetch(`${STRAVA_BASE_URL}${endpoint}`, {
    headers: {
      Authorization: `Bearer ${token.accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Strava API ${response.status}: ${response.statusText}`);
  }

  return response.json();
};
