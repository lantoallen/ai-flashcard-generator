'use client';

import CommunityFeed from './CommunityFeed';
import SocialGate from './SocialGate';

export default function CommunityScreen() {
  return (
    <SocialGate>
      <CommunityFeed />
    </SocialGate>
  );
}
