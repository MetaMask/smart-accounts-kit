/* eslint-disable @typescript-eslint/naming-convention */
import nock from 'nock';
import { describe, beforeEach, afterAll, it, expect } from 'vitest';

import { Analytics } from '.';
import {
  getInitializationContext,
  resetAnalyticsSessionForTests,
} from './environment';
import type { AnalyticsEventV2 } from './schema';

describe('Analytics', () => {
  let analytics: Analytics;

  beforeEach(() => {
    resetAnalyticsSessionForTests();
  });

  afterAll(() => {
    /* eslint-disable-next-line import-x/no-named-as-default-member */
    nock.cleanAll();
  });

  it('should do nothing when disabled', async () => {
    let captured: AnalyticsEventV2[] = [];
    const scope = nock('http://127.0.0.1')
      .post('/v2/events', (body) => {
        captured = body;
        return true;
      })
      .optionally()
      .reply(
        200,
        { status: 'success' },
        { 'Content-Type': 'application/json' },
      );

    getInitializationContext({
      sdk_version: '0.0.0-test',
      anon_id: '00000000-0000-4000-8000-000000000001',
    });
    analytics = new Analytics('http://127.0.0.1');
    analytics.trackInitialized();

    await new Promise((resolve) => setTimeout(resolve, 300));

    expect(captured).toEqual([]);

    scope.done();
  });

  it('should track initialization when enabled', async () => {
    let captured: AnalyticsEventV2[] = [];
    const scope = nock('http://127.0.0.2')
      .post('/v2/events', (body) => {
        captured = body;
        return true;
      })
      .reply(
        200,
        { status: 'success' },
        { 'Content-Type': 'application/json' },
      );

    getInitializationContext({
      sdk_version: '1.2.3',
      anon_id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
    });
    analytics = new Analytics('http://127.0.0.2');
    analytics.enable();
    analytics.trackInitialized({
      platform: 'web-desktop',
      domain: 'example.com',
    });

    await new Promise((resolve) => setTimeout(resolve, 300));

    expect(captured).toEqual([
      {
        namespace: 'metamask/smart-accounts-kit',
        event_name: 'smart_accounts_kit_initialized',
        properties: {
          sdk_version: '1.2.3',
          anon_id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
          platform: 'web-desktop',
          domain: 'example.com',
        },
      },
    ]);

    scope.done();
  });

  it('should track using session base only when trackInitialized has no args', async () => {
    let captured: AnalyticsEventV2[] = [];
    const scope = nock('http://127.0.0.3')
      .post('/v2/events', (body) => {
        captured = body;
        return true;
      })
      .reply(
        200,
        { status: 'success' },
        { 'Content-Type': 'application/json' },
      );

    getInitializationContext({
      sdk_version: '2.0.0',
      anon_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    });
    analytics = new Analytics('http://127.0.0.3');
    analytics.enable();
    analytics.trackInitialized();

    await new Promise((resolve) => setTimeout(resolve, 300));

    expect(captured).toEqual([
      {
        namespace: 'metamask/smart-accounts-kit',
        event_name: 'smart_accounts_kit_initialized',
        properties: {
          sdk_version: '2.0.0',
          anon_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
          platform: 'nodejs',
        },
      },
    ]);

    scope.done();
  });

  it('merges setGlobalProperty into session before trackInitialized', async () => {
    let captured: AnalyticsEventV2[] = [];
    const scope = nock('http://127.0.0.4')
      .post('/v2/events', (body) => {
        captured = body;
        return true;
      })
      .reply(
        200,
        { status: 'success' },
        { 'Content-Type': 'application/json' },
      );

    getInitializationContext({
      sdk_version: '1.0.0',
      anon_id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    });
    analytics = new Analytics('http://127.0.0.4');
    analytics.enable();
    analytics.setGlobalProperty('sdk_version', '3.0.0');
    analytics.trackInitialized();

    await new Promise((resolve) => setTimeout(resolve, 300));

    expect(captured[0]?.properties?.sdk_version).toBe('3.0.0');

    scope.done();
  });

  it('throws when session was never started', () => {
    resetAnalyticsSessionForTests();
    analytics = new Analytics('http://127.0.0.5');
    analytics.enable();
    expect(() => analytics.trackInitialized()).toThrow(
      /getInitializationContext/iu,
    );
  });

  it('should track SDK function call when enabled', async () => {
    let captured: AnalyticsEventV2[] = [];
    const scope = nock('http://127.0.0.6')
      .post('/v2/events', (body) => {
        captured = body;
        return true;
      })
      .reply(
        200,
        { status: 'success' },
        { 'Content-Type': 'application/json' },
      );

    getInitializationContext({
      sdk_version: '1.0.0',
      anon_id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
    });
    analytics = new Analytics('http://127.0.0.6');
    analytics.enable();
    analytics.trackSdkFunctionCall('testFn', { foo: 'bar' });

    await new Promise((resolve) => setTimeout(resolve, 300));

    expect(captured).toEqual([
      {
        namespace: 'metamask/smart-accounts-kit',
        event_name: 'smart_accounts_kit_function_called',
        properties: {
          sdk_version: '1.0.0',
          anon_id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
          platform: 'nodejs',
          function_name: 'testFn',
          parameters: { foo: 'bar' },
        },
      },
    ]);

    scope.done();
  });

  it('throws when trackSdkFunctionCall session was never started', () => {
    resetAnalyticsSessionForTests();
    analytics = new Analytics('http://127.0.0.7');
    analytics.enable();
    expect(() => analytics.trackSdkFunctionCall('x')).toThrow(
      /getInitializationContext/iu,
    );
  });
});
