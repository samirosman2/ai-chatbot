"use client";
import React, { useState, useEffect, JSX } from 'react';
import { supabase } from '@/lib/supabase';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { Camera } from 'lucide-react';
import Image from 'next/image';

interface ProfileProps {
  onProfileUpdate?: () => void;
}

interface ProfileData {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone_number: string | null;
  country_code: string | null;
  avatar_url: string | null;
  updated_at: string | null;
}

export default function Profile({ onProfileUpdate }: ProfileProps): JSX.Element {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{text: string; type: 'success' | 'error'} | null>(null);

  useEffect(() => {
    getProfile();
  }, []);

  async function getProfile() {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('No user found');

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      
      if (data) {
        console.log('Profile data loaded:', data);
        setProfile(data);
      }
      
    } catch (error) {
      console.error('Error loading profile:', error);
      setMessage({ text: 'Error loading profile', type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  async function updateProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;

    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('No user found');

      let newAvatarUrl = profile.avatar_url;
      if (avatarFile) {
        setUploading(true);
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;

        console.log('Uploading file:', fileName);

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, avatarFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);

        newAvatarUrl = publicUrl;
      }

      const updates = {
        id: user.id,
        first_name: profile.first_name || null,
        last_name: profile.last_name || null,
        phone_number: profile.phone_number || null,
        country_code: profile.country_code || null,
        avatar_url: newAvatarUrl,
        updated_at: new Date().toISOString()
      };

      console.log('Updating profile with:', updates);

      const { error } = await supabase
        .from('profiles')
        .upsert(updates);

      if (error) throw error;

      setMessage({ text: 'Profile updated successfully', type: 'success' });
      setTimeout(() => setMessage(null), 3000);
      
      if (onProfileUpdate) {
        onProfileUpdate();
      }
      
    } catch (error: any) {
      console.error('Update error:', error);
      setMessage({ text: error.message || 'Error updating profile', type: 'error' });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setLoading(false);
      setUploading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="text-red-500">Error loading profile</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Profile Settings</h2>
      
      <form onSubmit={updateProfile} className="space-y-6">
        {/* Avatar section */}
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Image
              src={profile.avatar_url || 'https://www.gravatar.com/avatar/0?d=mp'}
              alt="Profile"
              width={96}
              height={96}
              className="rounded-full object-cover border-2 border-gray-200"
            />
            <label className="absolute bottom-0 right-0 bg-blue-500 p-2 rounded-full cursor-pointer hover:bg-blue-600">
              <Camera className="w-4 h-4 text-white" />
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    if (file.size > 2 * 1024 * 1024) {
                      setMessage({ text: 'Image must be less than 2MB', type: 'error' });
                      setTimeout(() => setMessage(null), 3000);
                      return;
                    }
                    setAvatarFile(file);
                  }
                }}
              />
            </label>
          </div>
          <div className="text-sm text-gray-600">
            <p>Upload profile picture</p>
            <p>Maximum size: 2MB</p>
            <p>Formats: JPG, PNG</p>
          </div>
        </div>

        {/* Name fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">First Name</label>
            <input
              type="text"
              value={profile.first_name || ''}
              onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Last Name</label>
            <input
              type="text"
              value={profile.last_name || ''}
              onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Phone number with country code */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Phone Number</label>
          <PhoneInput
            country={'us'}
            value={profile.phone_number || ''}
            onChange={(phone, country: any) => {
              setProfile({
                ...profile,
                phone_number: phone,
                country_code: country.dialCode
              });
            }}
            containerClass="mt-1"
            inputClass="w-full p-2 border border-gray-300 rounded-md focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            buttonClass="border border-gray-300 rounded-l-md"
          />
        </div>

        {/* Message display */}
        {message && (
          <div className={`p-3 rounded-md ${
            message.type === 'success' 
              ? 'bg-blue-50 text-blue-700 border border-blue-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={loading || uploading}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 transition-colors"
        >
          {loading || uploading ? 'Saving...' : 'Save Profile'}
        </button>
      </form>
    </div>
  );
}