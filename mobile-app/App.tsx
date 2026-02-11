import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, Button, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { supabase } from './services/SupabaseService';
import { syncTransactions, SyncResult } from './services/SyncService';
import { Session } from '@supabase/supabase-js';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [syncLogs, setSyncLogs] = useState<string[]>([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

  async function signInWithEmail() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) Alert.alert(error.message);
    setLoading(false);
  }

  async function handleSync() {
    setLoading(true);
    try {
      addLog("Starting sync...");
      const result: SyncResult = await syncTransactions();
      addLog(`Found ${result.totalFound} messages.`);
      addLog(`Parsed ${result.parsed} potential transactions.`);
      addLog(`Successfully synced ${result.synced} transactions ✅`);
      if (result.errors.length > 0) {
        addLog(`Errors: ${result.errors.length}`);
      }
    } catch (e: any) {
        addLog(`Error: ${e.message}`);
        console.error(e);
    } finally {
        setLoading(false);
    }
  }

  function addLog(msg: string) {
    setSyncLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);
  }

  if (!session) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Budget Planner Sync</Text>
        <View style={styles.form}>
           <TextInput
             style={styles.input}
             onChangeText={setEmail}
             value={email}
             placeholder="email@address.com"
             placeholderTextColor={'#999'}
             autoCapitalize={'none'}
           />
           <TextInput
             style={styles.input}
             onChangeText={setPassword}
             value={password}
             secureTextEntry={true}
             placeholder="Password"
             placeholderTextColor={'#999'}
             autoCapitalize={'none'}
           />
           <Button title="Sign In" disabled={loading} onPress={signInWithEmail} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
        <View style={styles.header}>
            <Text style={styles.title}>SMS Sync Active</Text>
            <Text style={styles.subtitle}>Logged in as {session.user.email}</Text>
            <Button title="Sign Out" onPress={() => supabase.auth.signOut()} color="red" />
        </View>

        <View style={styles.card}>
            <Text style={styles.cardTitle}>Sync Transactions</Text>
            <Text style={styles.cardDesc}>Reads SMS from inbox and syncs new expenses.</Text>
            <View style={{ marginTop: 10 }}>
                {loading ? <ActivityIndicator color="#0000ff" /> : <Button title="Sync Now" onPress={handleSync} />}
            </View>
        </View>

        <View style={styles.logsContainer}>
            <Text style={styles.logsTitle}>Logs</Text>
            <ScrollView style={styles.logsScroll}>
                {syncLogs.map((log, i) => (
                    <Text key={i} style={styles.logText}>{log}</Text>
                ))}
            </ScrollView>
        </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  form: {
    gap: 12,
  },
  header: {
    marginBottom: 30,
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 10,
    color: '#000',
  },
  card: {
    backgroundColor: '#f9f9f9',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#eee',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 6,
  },
  cardDesc: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  logsContainer: {
    flex: 1,
  },
  logsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  logsScroll: {
    flex: 1,
    backgroundColor: '#333',
    borderRadius: 8,
    padding: 10,
  },
  logText: {
    color: '#0f0',
    fontFamily: 'monospace',
    fontSize: 12,
    marginBottom: 4,
  },
});
