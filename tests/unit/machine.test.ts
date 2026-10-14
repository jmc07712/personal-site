import { describe, expect, it } from 'vitest';
import { gpuLabel, uptimeLabel } from '@/components/os/machine';

describe('gpuLabel', () => {
  it('unwraps the GPU from ANGLE renderer strings', () => {
    expect(gpuLabel('ANGLE (Apple, ANGLE Metal Renderer: Apple M3 Pro, Unspecified Version)')).toBe(
      'Apple M3 Pro',
    );
    expect(
      gpuLabel(
        'ANGLE (NVIDIA, NVIDIA GeForce RTX 3080 (0x00002206) Direct3D11 vs_5_0 ps_5_0, D3D11)',
      ),
    ).toBe('NVIDIA GeForce RTX 3080');
  });

  it('leaves plain names alone', () => {
    expect(gpuLabel('Apple GPU')).toBe('Apple GPU');
    expect(gpuLabel('WebGL2')).toBe('WebGL2');
  });
});

describe('uptimeLabel', () => {
  it('reads like a clock', () => {
    expect(uptimeLabel(42.7)).toBe('42 s');
    expect(uptimeLabel(185)).toBe('3 min 05 s');
    expect(uptimeLabel(3840)).toBe('1 h 04 min');
  });
});
