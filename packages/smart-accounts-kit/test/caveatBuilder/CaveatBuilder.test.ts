import { spy } from 'sinon';
import { toHex } from 'viem';
import { expect, describe, it, beforeEach } from 'vitest';

import { CaveatBuilder } from '../../src/caveatBuilder/caveatBuilder';
import type { Caveat, SmartAccountsEnvironment } from '../../src/types';
import { randomAddress } from '../utils';

describe('CaveatBuilder', () => {
  const caveat1: Caveat = {
    enforcer: randomAddress(),
    terms: '0x0',
    args: '0x00',
  };

  const caveat2: Caveat = {
    enforcer: randomAddress(),
    terms: '0x0',
    args: '0x00',
  };

  describe('ctor', () => {
    it('should instantiate a CaveatBuilder', () => {
      const builder = new CaveatBuilder({} as SmartAccountsEnvironment);

      expect(builder).to.be.instanceOf(CaveatBuilder);
    });
  });

  describe('allowInsecureUnrestrictedDelegation', () => {
    it('should disallow empty caveats', () => {
      const builder = new CaveatBuilder({} as SmartAccountsEnvironment);

      expect(() => builder.build()).to.throw(
        'No caveats found. If you definitely want to create an empty caveat collection, set `allowInsecureUnrestrictedDelegation` to `true`.',
      );
    });

    it('should allow empty caveats', () => {
      const builder = new CaveatBuilder({} as SmartAccountsEnvironment, {
        allowInsecureUnrestrictedDelegation: true,
      });

      expect(() => builder.build()).to.not.throw();
    });

    it('should allow empty caveats when extended', () => {
      const builder = new CaveatBuilder({} as SmartAccountsEnvironment, {
        allowInsecureUnrestrictedDelegation: true,
      }).extend('caveat', () => caveat1);

      expect(() => builder.build()).to.not.throw();
    });
  });

  describe('extend()', () => {
    it('should extend the builder with an addable CaveatBuilder', () => {
      const builder = new CaveatBuilder({} as SmartAccountsEnvironment).extend(
        'caveat1',
        (_environment: SmartAccountsEnvironment, _arg: string) => caveat1,
      );

      const extendedBuilder = builder.addCaveat('caveat1', 'string');

      expect(extendedBuilder).to.equal(builder);
    });

    it('should be extended with multiple caveat builders', () => {
      const builder = new CaveatBuilder({} as SmartAccountsEnvironment)
        .extend(
          'caveat1',
          (_environment: SmartAccountsEnvironment, _arg: string) => caveat1,
        )
        .extend(
          'caveat2',
          (_environment: SmartAccountsEnvironment, _arg: number) => caveat2,
        );

      const extendedBuilder = builder
        .addCaveat('caveat1', 'string')
        .addCaveat('caveat2', 1);

      expect(extendedBuilder).to.equal(builder);
    });
  });

  describe('addCaveat()', () => {
    const environment = {} as SmartAccountsEnvironment;

    const caveatBuilderFunc1 = spy(
      (_environment: SmartAccountsEnvironment, _arg: string) => caveat1,
    );

    const caveatBuilderFunc2 = spy(
      (_environment: SmartAccountsEnvironment, _arg: number) => caveat2,
    );

    let builder: CaveatBuilder<{
      caveat1: typeof caveatBuilderFunc1;
      caveat2: typeof caveatBuilderFunc2;
    }>;

    beforeEach(() => {
      caveatBuilderFunc1.resetHistory();
      caveatBuilderFunc2.resetHistory();

      builder = new CaveatBuilder(environment)
        .extend('caveat1', caveatBuilderFunc1)
        .extend('caveat2', caveatBuilderFunc2);
    });

    it("should call the caveat builder's function", () => {
      builder.addCaveat('caveat1', 'value');

      expect(caveatBuilderFunc1.calledOnce).to.equal(true);
      expect(caveatBuilderFunc1.calledWith(environment, 'value')).to.equal(
        true,
      );
    });

    it("should call the caveat builder's function", () => {
      builder.addCaveat('caveat1', 'value');

      expect(caveatBuilderFunc1.calledOnce).to.equal(true);
      expect(caveatBuilderFunc1.calledWith(environment, 'value')).to.equal(
        true,
      );
    });

    it('should call two caveat builders when chained', () => {
      builder.addCaveat('caveat1', 'value').addCaveat('caveat2', 1);

      expect(caveatBuilderFunc1.calledOnce).to.equal(true);
      expect(caveatBuilderFunc1.calledWith(environment, 'value')).to.equal(
        true,
      );

      expect(caveatBuilderFunc2.calledOnce).to.equal(true);
      expect(caveatBuilderFunc2.calledWith(environment, 1)).to.equal(true);
    });

    it('should call the same caveat builders twice when chained', () => {
      builder.addCaveat('caveat1', 'value').addCaveat('caveat1', 'value 2');

      expect(caveatBuilderFunc1.calledTwice).to.equal(true);
      expect(caveatBuilderFunc1.calledWith(environment, 'value')).to.equal(
        true,
      );
      expect(caveatBuilderFunc1.calledWith(environment, 'value 2')).to.equal(
        true,
      );
    });

    it('should call two caveat builders when called in sequence', () => {
      builder.addCaveat('caveat1', 'value');
      builder.addCaveat('caveat2', 1);

      expect(caveatBuilderFunc1.calledOnce).to.equal(true);
      expect(caveatBuilderFunc1.calledWith(environment, 'value')).to.equal(
        true,
      );

      expect(caveatBuilderFunc2.calledOnce).to.equal(true);
      expect(caveatBuilderFunc2.calledWith(environment, 1)).to.equal(true);
    });

    it('should accept a Caveat directly', () => {
      builder.addCaveat(caveat1);
      builder.addCaveat('caveat2', 1);

      expect(builder.build()).to.deep.equal([caveat1, caveat2]);
    });
  });

  describe('build()', () => {
    const environment = {} as SmartAccountsEnvironment;

    const caveat1Address = randomAddress();
    const caveat2Address = randomAddress();

    const caveatBuilderFunc1 = spy(
      (_environment: SmartAccountsEnvironment, arg: string) => ({
        enforcer: caveat1Address,
        terms: toHex(arg),
        args: '0x00' as const,
      }),
    );

    const caveatBuilderFunc2 = spy(
      (_environment: SmartAccountsEnvironment, arg: number) => ({
        enforcer: caveat2Address,
        terms: toHex(arg),
        args: '0x00' as const,
      }),
    );

    let builder: CaveatBuilder<{
      caveat1: typeof caveatBuilderFunc1;
      caveat2: typeof caveatBuilderFunc2;
    }>;

    beforeEach(() => {
      builder = new CaveatBuilder(environment)
        .extend('caveat1', caveatBuilderFunc1)
        .extend('caveat2', caveatBuilderFunc2);

      caveatBuilderFunc1.resetHistory();
      caveatBuilderFunc2.resetHistory();
    });

    it('should return the caveat added to the builder', () => {
      const caveats = builder.addCaveat('caveat1', 'value').build();

      const expectedCaveat = {
        enforcer: caveat1Address,
        terms: toHex('value'),
        args: '0x00',
      };

      expect(caveats).to.deep.equal([expectedCaveat]);
    });

    it('should return two instances of the same caveat when chained', () => {
      const caveats = builder
        .addCaveat('caveat1', 'value')
        .addCaveat('caveat1', 'value2')
        .build();

      const expectedCaveats = [
        {
          enforcer: caveat1Address,
          terms: toHex('value'),
          args: '0x00',
        },
        {
          enforcer: caveat1Address,
          terms: toHex('value2'),
          args: '0x00',
        },
      ];

      expect(caveats).to.deep.equal(expectedCaveats);
    });

    it('should return two caveats when chained', () => {
      const caveats = builder
        .addCaveat('caveat1', 'value')
        .addCaveat('caveat2', 1)
        .build();

      const expectedCaveats = [
        {
          enforcer: caveat1Address,
          terms: toHex('value'),
          args: '0x00',
        },
        {
          enforcer: caveat2Address,
          terms: toHex(1),
          args: '0x00',
        },
      ];

      expect(caveats).to.deep.equal(expectedCaveats);
    });

    it('should return two caveats when called in sequence', () => {
      builder.addCaveat('caveat1', 'value');
      builder.addCaveat('caveat2', 1);

      const caveats = builder.build();

      const expectedCaveats = [
        {
          enforcer: caveat1Address,
          terms: toHex('value'),
          args: '0x00',
        },
        {
          enforcer: caveat2Address,
          terms: toHex(1),
          args: '0x00',
        },
      ];

      expect(caveats).to.deep.equal(expectedCaveats);
    });

    it('should not allow build() to be called twice', () => {
      builder.addCaveat('caveat1', 'value');
      builder.build();

      expect(() => {
        builder.build();
      }).to.throw('This CaveatBuilder has already been built.');
    });
  });
});
