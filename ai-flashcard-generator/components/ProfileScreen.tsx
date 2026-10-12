'use client';

import ProfileEditor from './ProfileEditor';
import SocialGate from './SocialGate';

export default function ProfileScreen() {
  return (
    <SocialGate>
      <ProfileEditor />
    </SocialGate>
  );
}
