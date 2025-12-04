
import React, { useState, useEffect } from 'react';
import { UserProfile, DailyAttendance, PunchRecord } from '../types';
import { getCurrentPosition, getDistanceFromLatLonInMeters } from '../utils';
import { saveDailyAttendance, getDailyAttendance, syncAttendanceToGoogleSheets } from '../services/mockDatabase';
import { Button } from './Button';
import { MapPin, Clock, UploadCloud, AlertOctagon, CheckCircle2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface AttendancePanelProps {
  user: UserProfile;
}

export const AttendancePanel: React.FC<AttendancePanelProps> = ({ user }) => {
  const [loading, setLoading] = useState(false);
  const [attendance, setAttendance] = useState<DailyAttendance | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [statusType, setStatusType] = useState<'info' | 'error' | 'success'>('info');

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    loadAttendance();
  }, [user.uid]);

  const loadAttendance = async () => {
    const record = await getDailyAttendance(user.uid, todayStr);
    setAttendance(record);
  };

  const handlePunch = async (type: 'IN' | 'OUT') => {
    setLoading(true);
    setStatusMessage('Acquiring high-accuracy GPS signal...');
    setStatusType('info');

    try {
      const position = await getCurrentPosition();
      const { latitude, longitude, accuracy } = position.coords;

      // Anti-spoofing check 1: Accuracy
      if (accuracy > 1000) { // Reject if accuracy is worse than 1km
        setStatusMessage(`GPS signal too weak (Accuracy: ${Math.round(accuracy)}m). Please move outdoors.`);
        setStatusType('error');
        setLoading(false);
        return;
      }

      // Territory Verification
      let matchedTerritoryId = undefined;
      let matchedTerritoryName = undefined;
      let minDistance = Infinity;

      // Check all assigned territories to find the closest valid one
      for (const t of user.territories) {
        if (t.geoLat && t.geoLng && t.geoRadius) {
          const dist = getDistanceFromLatLonInMeters(latitude, longitude, t.geoLat, t.geoLng);
          if (dist <= t.geoRadius) {
            matchedTerritoryId = t.id;
            matchedTerritoryName = t.name;
            break; // Found a match
          }
          if (dist < minDistance) minDistance = dist;
        }
      }

      // If Punching IN, check verification status
      if (type === 'IN') {
        if (!matchedTerritoryId) {
          // If close but not inside, maybe show distance?
          const msg = minDistance < 10000
            ? `Warning: You are ${Math.round(minDistance)}m away from closest territory.`
            : 'Warning: You are not inside any assigned geofenced territory.';

          setStatusMessage(msg);
          setStatusType('error');
          // In strict mode, we might return here. For now, we allow punch with warning.
        } else {
          setStatusMessage(`Verified: Inside ${matchedTerritoryName}`);
          setStatusType('success');
        }
      }

      const punch: PunchRecord = {
        id: uuidv4(),
        type,
        timestamp: new Date().toISOString(),
        location: {
          latitude,
          longitude,
          accuracy,
          timestamp: position.timestamp
        },
        verifiedTerritoryId: matchedTerritoryId,
        verifiedTerritoryName: matchedTerritoryName
      };

      // Ensure we work with the latest attendance record or create a new one if not loaded yet
      const currentAttendance = attendance || {
        id: `${user.uid}_${todayStr}`,
        userId: user.uid,
        date: todayStr,
        punchIn: null,
        punchOuts: [],
        isSyncedToSheets: false
      };

      const updated = { ...currentAttendance };
      if (type === 'IN') {
        updated.punchIn = punch;
      } else {
        updated.punchOuts = [...updated.punchOuts, punch];
      }

      updated.isSyncedToSheets = false; // Reset sync status on change

      await saveDailyAttendance(updated);
      setAttendance(updated);

      // Auto-sync attempt
      if (statusType !== 'error') {
        setStatusMessage('Punch recorded. Syncing to cloud...');
      }

      await syncAttendanceToGoogleSheets(updated);
      setAttendance(prev => prev ? { ...prev, isSyncedToSheets: true } : null);

      if (type === 'IN' && matchedTerritoryId) {
        setStatusMessage(`Successfully Punched IN at ${matchedTerritoryName}`);
      } else if (type === 'OUT') {
        setStatusMessage(`Successfully Punched OUT at ${new Date().toLocaleTimeString()}`);
      }

    } catch (err: any) {
      console.error(err);
      setStatusMessage(err.message || 'Failed to get location.');
      setStatusType('error');
    } finally {
      setLoading(false);
    }
  };

  if (!attendance) return <div>Loading...</div>;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
        <h2 className="font-bold text-slate-700 flex items-center">
          <MapPin className="mr-2 text-blue-600" size={20} />
          GPS Attendance
        </h2>
        <div className="text-sm text-slate-500">{new Date().toDateString()}</div>
      </div>

      <div className="p-6">
        {/* Status Area */}
        {statusMessage && (
          <div className={`mb-6 p-3 rounded text-sm flex items-center ${statusType === 'error' ? 'bg-red-50 text-red-700' :
              statusType === 'success' ? 'bg-green-50 text-green-700' :
                'bg-blue-50 text-blue-700'
            }`}>
            {statusType === 'error' && <AlertOctagon size={16} className="mr-2" />}
            {statusType === 'success' && <CheckCircle2 size={16} className="mr-2" />}
            {statusMessage}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

          {/* PUNCH IN SECTION */}
          <div className="border rounded-lg p-4 flex flex-col items-center justify-center text-center bg-slate-50/50">
            <div className="text-slate-500 font-medium mb-2 uppercase text-xs tracking-wider">Start Day</div>
            {attendance.punchIn ? (
              <div className="w-full">
                <div className="text-3xl font-bold text-slate-800 mb-1">
                  {new Date(attendance.punchIn.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mb-4">
                  Punched In
                </div>
                <div className="text-xs text-left text-slate-500 border-t pt-2 space-y-1">
                  <p>Location: {attendance.punchIn.location.latitude.toFixed(4)}, {attendance.punchIn.location.longitude.toFixed(4)}</p>
                  <p>Territory: <span className={attendance.punchIn.verifiedTerritoryId ? 'text-green-600 font-bold' : 'text-red-500 font-bold'}>
                    {attendance.punchIn.verifiedTerritoryName || 'Unverified Location'}
                  </span></p>
                </div>
              </div>
            ) : (
              <Button
                onClick={() => handlePunch('IN')}
                disabled={loading}
                className="w-full h-24 text-lg bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200"
              >
                {loading ? 'Locating...' : 'PUNCH IN'}
              </Button>
            )}
          </div>

          {/* PUNCH OUT SECTION */}
          <div className="border rounded-lg p-4 flex flex-col items-center justify-center text-center bg-slate-50/50">
            <div className="text-slate-500 font-medium mb-2 uppercase text-xs tracking-wider">End Work / Visit</div>

            {!attendance.punchIn ? (
              <div className="text-slate-400 text-sm">You must punch in first.</div>
            ) : (
              <div className="w-full">
                <Button
                  variant="danger"
                  onClick={() => handlePunch('OUT')}
                  disabled={loading}
                  className="w-full h-12 mb-4"
                >
                  {loading ? 'Locating...' : 'PUNCH OUT'}
                </Button>

                {attendance.punchOuts.length > 0 && (
                  <div className="text-left text-xs text-slate-500 border-t pt-2 max-h-32 overflow-y-auto custom-scrollbar">
                    <p className="font-semibold mb-1">Punch Out History:</p>
                    {attendance.punchOuts.map((out, idx) => (
                      <div key={out.id} className="flex justify-between py-1 border-b border-slate-100 last:border-0">
                        <span>{new Date(out.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <span className={out.verifiedTerritoryId ? 'text-green-600' : 'text-slate-400'}>
                          {out.verifiedTerritoryName || 'Unknown Loc'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-between items-center text-xs text-slate-400">
          <div className="flex items-center">
            <UploadCloud size={14} className={`mr-1 ${attendance.isSyncedToSheets ? 'text-green-500' : 'text-amber-500'}`} />
            Sync Status: {attendance.isSyncedToSheets ? 'Synced to Sheets' : 'Pending'}
          </div>
          <div>
            GPS Accuracy required: &lt; 1000m
          </div>
        </div>
      </div>
    </div>
  );
};
