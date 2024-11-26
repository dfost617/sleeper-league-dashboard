import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUp, ArrowDown, RefreshCcw } from 'lucide-react';

const LeagueDashboard = () => {
  const [scores, setScores] = useState([]);
  const [median, setMedian] = useState(0);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [currentWeek, setCurrentWeek] = useState(null);
  const [users, setUsers] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  
  const LEAGUE_ID = "1075320395261108224";

  // Fetch league users to get team names
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch(`https://api.sleeper.app/v1/league/${LEAGUE_ID}/users`);
        const data = await response.json();
        const userMap = {};
        data.forEach(user => {
          userMap[user.user_id] = user.display_name || user.username;
        });
        setUsers(userMap);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();
  }, []);

  // Fetch rosters to map roster_id to user_id
  const [rosterMap, setRosterMap] = useState({});
  useEffect(() => {
    const fetchRosters = async () => {
      try {
        const response = await fetch(`https://api.sleeper.app/v1/league/${LEAGUE_ID}/rosters`);
        const data = await response.json();
        const map = {};
        data.forEach(roster => {
          map[roster.roster_id] = roster.owner_id;
        });
        setRosterMap(map);
      } catch (error) {
        console.error('Error fetching rosters:', error);
      }
    };

    fetchRosters();
  }, []);

  useEffect(() => {
    const fetchNFLState = async () => {
      try {
        const response = await fetch('https://api.sleeper.app/v1/state/nfl');
        const data = await response.json();
        setCurrentWeek(data.week);
      } catch (error) {
        console.error('Error fetching NFL state:', error);
      }
    };

    fetchNFLState();
  }, []);

  useEffect(() => {
    if (!currentWeek) return;

    const fetchScores = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`https://api.sleeper.app/v1/league/${LEAGUE_ID}/matchups/${currentWeek}`);
        const matchups = await response.json();
        
        const sortedScores = matchups
          .map(team => ({
            rosterId: team.roster_id,
            points: team.points || 0,
            userId: rosterMap[team.roster_id]
          }))
          .sort((a, b) => b.points - a.points);

        const middle = Math.floor(sortedScores.length / 2);
        const medianScore = sortedScores.length % 2 === 0
          ? (sortedScores[middle - 1].points + sortedScores[middle].points) / 2
          : sortedScores[middle].points;

        setScores(sortedScores);
        setMedian(medianScore);
        setLastUpdated(new Date());
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching scores:', error);
        setIsLoading(false);
      }
    };

    fetchScores();
    const interval = setInterval(fetchScores, 60000);
    return () => clearInterval(interval);
  }, [currentWeek, rosterMap]);

  if (!currentWeek || isLoading) {
    return (
      <Card>
        <CardContent className="p-4 flex items-center justify-center">
          <RefreshCcw className="animate-spin mr-2" />
          Loading data...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Live League Scoring Dashboard - Week {currentWeek}</CardTitle>
          {lastUpdated && (
            <p className="text-sm text-gray-500">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2 flex items-center">
                <ArrowUp className="text-green-500 mr-2" /> Top Scoring Teams
              </h3>
              <div className="space-y-2">
                {scores.slice(0, Math.ceil(scores.length/2)).map((team, index) => (
                  <div key={team.rosterId} 
                       className={`flex justify-between p-2 rounded ${
                         team.points > median ? 'bg-green-50' : 'bg-gray-50'
                       }`}>
                    <span>{users[team.userId] || `Team ${team.rosterId}`}</span>
                    <span className="font-medium">{team.points.toFixed(2)} pts</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2 flex items-center">
                <ArrowDown className="text-red-500 mr-2" /> Bottom Scoring Teams
              </h3>
              <div className="space-y-2">
                {scores.slice(Math.ceil(scores.length/2)).map((team, index) => (
                  <div key={team.rosterId} 
                       className={`flex justify-between p-2 rounded ${
                         team.points > median ? 'bg-green-50' : 'bg-gray-50'
                       }`}>
                    <span>{users[team.userId] || `Team ${team.rosterId}`}</span>
                    <span className="font-medium">{team.points.toFixed(2)} pts</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded">
            <h3 className="font-semibold mb-2">League Median: {median.toFixed(2)} pts</h3>
            <p className="text-sm text-gray-600">
              Teams highlighted in green will receive an extra win this week
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LeagueDashboard;
