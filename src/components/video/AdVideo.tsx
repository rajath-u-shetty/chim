import { AbsoluteFill, Sequence, useCurrentFrame, interpolate, Composition } from 'remotion';
import React from 'react';

interface AdVideoProps {
  script: string;
}

const TextSection: React.FC<{
  visual: string;
  voiceover: string;
  style?: React.CSSProperties;
}> = ({ visual, voiceover, style }) => {
  return (
    <AbsoluteFill
      style={{
        ...style,
        padding: 40,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        fontFamily: 'system-ui',
        backgroundColor: 'white',
      }}
    >
      <h1
        style={{
          fontSize: 48,
          fontWeight: 'bold',
          marginBottom: 20,
          color: '#1a1a1a',
        }}
      >
        {visual}
      </h1>
      <p
        style={{
          fontSize: 24,
          color: '#4a4a4a',
          maxWidth: 800,
          lineHeight: 1.5,
        }}
      >
        {voiceover}
      </p>
    </AbsoluteFill>
  );
};

export const AdVideo: React.FC<AdVideoProps> = ({ script }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateRight: 'clamp',
  });

  // Split script into sections (assuming format: "VISUAL: ... VO: ...")
  const sections = script
    .split('\n\n')
    .filter(Boolean)
    .map((section) => {
      const [visual, voiceover] = section.split('\nVO: ');
      return {
        visual: visual.replace('VISUAL: ', '').trim(),
        voiceover: voiceover?.trim() || '',
      };
    });

  return (
    <AbsoluteFill style={{ backgroundColor: 'white' }}>
      {sections.map((section, index) => (
        <Sequence
          key={index}
          from={index * 90} // 3 seconds per section
          durationInFrames={90}
        >
          <TextSection
            visual={section.visual}
            voiceover={section.voiceover}
            style={{ opacity }}
          />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

// Export just the component, let the API handle composition configuration
export default AdVideo; 