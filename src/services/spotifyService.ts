import SpotifyWebApi from 'spotify-web-api-node';
import { logger } from '../utils/logger';
import { SpotifyUser, SpotifyTrack } from '../types';

class SpotifyService {
  private static instance: SpotifyService;
  private spotifyApi: SpotifyWebApi;

  private constructor() {
    this.spotifyApi = new SpotifyWebApi({
      clientId: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
      redirectUri: process.env.SPOTIFY_REDIRECT_URI
    });
  }

  public static getInstance(): SpotifyService {
    if (!SpotifyService.instance) {
      SpotifyService.instance = new SpotifyService();
    }
    return SpotifyService.instance;
  }

  public getAuthorizationUrl(state: string): string {
    const scopes = [
      'user-read-private',
      'user-read-email',
      'user-read-currently-playing',
      'user-read-playback-state',
      'user-library-read',
      'playlist-read-private',
      'user-read-recently-played',
      'user-top-read',
      'user-read-playback-position',
      'user-follow-read'
    ];

    return this.spotifyApi.createAuthorizeURL(scopes, state);
  }

  public async exchangeCodeForToken(code: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    try {
      const data = await this.spotifyApi.authorizationCodeGrant(code);
      
      const { access_token, refresh_token, expires_in } = data.body;
      
      return {
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresIn: expires_in
      };
    } catch (error) {
      logger.error('Error exchanging code for token:', error);
      throw new Error('Failed to exchange authorization code for token');
    }
  }

  public async refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string;
    expiresIn: number;
  }> {
    try {
      this.spotifyApi.setRefreshToken(refreshToken);
      const data = await this.spotifyApi.refreshAccessToken();
      
      const { access_token, expires_in } = data.body;
      
      return {
        accessToken: access_token,
        expiresIn: expires_in
      };
    } catch (error) {
      logger.error('Error refreshing access token:', error);
      throw new Error('Failed to refresh access token');
    }
  }

  public async getCurrentUser(accessToken: string): Promise<SpotifyUser> {
    try {
      this.spotifyApi.setAccessToken(accessToken);
      const data = await this.spotifyApi.getMe();
      
      return data.body as SpotifyUser;
    } catch (error) {
      logger.error('Error fetching current user:', error);
      throw new Error('Failed to fetch current user from Spotify');
    }
  }

  public async getCurrentlyPlaying(accessToken: string): Promise<SpotifyTrack | null> {
    try {
      this.spotifyApi.setAccessToken(accessToken);
      const data = await this.spotifyApi.getMyCurrentPlayingTrack();
      
      if (!data.body.item) {
        return null;
      }
      
      return data.body.item as SpotifyTrack;
    } catch (error) {
      logger.error('Error fetching currently playing track:', error);
      return null;
    }
  }

  public async getUserTopTracks(
    accessToken: string, 
    timeRange: 'short_term' | 'medium_term' | 'long_term' = 'medium_term',
    limit: number = 20
  ): Promise<SpotifyTrack[]> {
    try {
      this.spotifyApi.setAccessToken(accessToken);
      const data = await this.spotifyApi.getMyTopTracks({
        time_range: timeRange,
        limit
      });
      
      return data.body.items as SpotifyTrack[];
    } catch (error) {
      logger.error('Error fetching user top tracks:', error);
      throw new Error('Failed to fetch user top tracks');
    }
  }

  public async getUserRecentlyPlayed(
    accessToken: string, 
    limit: number = 20
  ): Promise<SpotifyTrack[]> {
    try {
      this.spotifyApi.setAccessToken(accessToken);
      const data = await this.spotifyApi.getMyRecentlyPlayedTracks({
        limit
      });
      
      return data.body.items.map(item => item.track as SpotifyTrack);
    } catch (error) {
      logger.error('Error fetching recently played tracks:', error);
      throw new Error('Failed to fetch recently played tracks');
    }
  }

  public async getUserPlaylists(
    accessToken: string, 
    limit: number = 20,
    offset: number = 0
  ): Promise<any[]> {
    try {
      this.spotifyApi.setAccessToken(accessToken);
      const data = await this.spotifyApi.getUserPlaylists({
        limit,
        offset
      });
      
      return data.body.items;
    } catch (error) {
      logger.error('Error fetching user playlists:', error);
      throw new Error('Failed to fetch user playlists');
    }
  }

  public async getUserSavedTracks(
    accessToken: string, 
    limit: number = 20,
    offset: number = 0
  ): Promise<SpotifyTrack[]> {
    try {
      this.spotifyApi.setAccessToken(accessToken);
      const data = await this.spotifyApi.getMySavedTracks({
        limit,
        offset
      });
      
      return data.body.items.map(item => item.track as SpotifyTrack);
    } catch (error) {
      logger.error('Error fetching saved tracks:', error);
      throw new Error('Failed to fetch saved tracks');
    }
  }

  public async searchTracks(
    accessToken: string,
    query: string,
    limit: number = 20
  ): Promise<SpotifyTrack[]> {
    try {
      this.spotifyApi.setAccessToken(accessToken);
      const data = await this.spotifyApi.searchTracks(query, {
        limit
      });
      
      return data.body.tracks?.items as SpotifyTrack[] || [];
    } catch (error) {
      logger.error('Error searching tracks:', error);
      throw new Error('Failed to search tracks');
    }
  }

  public async getTrack(
    accessToken: string,
    trackId: string
  ): Promise<SpotifyTrack> {
    try {
      this.spotifyApi.setAccessToken(accessToken);
      const data = await this.spotifyApi.getTrack(trackId);
      
      return data.body as SpotifyTrack;
    } catch (error) {
      logger.error('Error fetching track:', error);
      throw new Error('Failed to fetch track details');
    }
  }

  public async getRecommendations(
    accessToken: string,
    seedTracks: string[],
    limit: number = 20
  ): Promise<SpotifyTrack[]> {
    try {
      this.spotifyApi.setAccessToken(accessToken);
      const data = await this.spotifyApi.getRecommendations({
        seed_tracks: seedTracks,
        limit
      });
      
      return data.body.tracks as SpotifyTrack[];
    } catch (error) {
      logger.error('Error fetching recommendations:', error);
      throw new Error('Failed to fetch track recommendations');
    }
  }

  public validateToken(accessToken: string): boolean {
    try {
      this.spotifyApi.setAccessToken(accessToken);
      return true;
    } catch (error) {
      return false;
    }
  }

  public async testConnection(): Promise<boolean> {
    try {
      if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
        logger.error('Spotify credentials not configured');
        return false;
      }
      
      // Test basic configuration
      const authUrl = this.getAuthorizationUrl('test');
      return authUrl.includes('spotify.com');
    } catch (error) {
      logger.error('Spotify service connection test failed:', error);
      return false;
    }
  }
}

export const spotifyService = SpotifyService.getInstance();
export default spotifyService;
