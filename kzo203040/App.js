import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  Image, 
  Dimensions, 
  ActivityIndicator, 
  ImageBackground,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

// --- הגדרות API של Groq ---
const GROQ_API_KEY = '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'; 
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

async function askGroq(prompt) {
  try {
    const response = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile", 
        messages: [
          { 
            role: "system", 
            content: "אתה עוזר כושר ותזונה אישי מקצועי. תפקידך לבנות תוכניות אימון הדרגתיות ותפריטי תזונה בריאים. בתפריט התזונה, עליך לפרט משקלים וכמויות מדויקים. דגש חשוב: בתוכנית דיאטה אין להמליץ על יותר מפרי אחד בארוחה. ענה בעברית בלבד ובצורה תמציתית." 
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.8 
      })
    });
    
    const data = await response.json();
    if (data.error) return `שגיאה: ${data.error.message}`;
    return data.choices[0].message.content;
  } catch (error) {
    return "שגיאת חיבור לשרת.";
  }
}

// --- מסכי האפליקציה ---

function LoginScreen({ onLogin }) {
  const [userData, setUserData] = useState({ 
    name: '', age: '', height: '', weight: '', sportType: '', 
    homeFoods: '', likes: '', dislikes: '',
    hasWeights: '', maxWeight: '', dailyCalories: '', weightHistory: [],
    weightDay: 'שבת',
    daysDone: 0
  });

  const handleLogin = () => {
    if (!userData.name || !userData.weight) {
      Alert.alert("חסרים פרטים", "אנא מלא שם ומשקל לפחות.");
      return;
    }
    const initialHistory = [{ date: new Date().toLocaleDateString(), weight: userData.weight }];
    onLogin({ ...userData, weightHistory: initialHistory });
  };

  return (
    <ImageBackground source={{ uri: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438' }} style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <BlurView intensity={90} tint="dark" style={styles.fullOverlay}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 50 }}>
            <Text style={styles.title}>פרטים אישיים ותזונה</Text>
            
            <TextInput placeholder="שם מלא" placeholderTextColor="#aaa" style={styles.darkInput} onChangeText={(v) => setUserData({...userData, name: v})} />
            <TextInput placeholder="משקל (ק״ג)" placeholderTextColor="#aaa" keyboardType="numeric" style={styles.darkInput} onChangeText={(v) => setUserData({...userData, weight: v})} />
            <TextInput placeholder="באיזה יום תרצה למדוד משקל? (למשל: שבת)" placeholderTextColor="#aaa" style={styles.darkInput} onChangeText={(v) => setUserData({...userData, weightDay: v})} />
            <TextInput placeholder="כמה קלוריות ליום תרצה לצרוך?" placeholderTextColor="#aaa" keyboardType="numeric" style={styles.darkInput} onChangeText={(v) => setUserData({...userData, dailyCalories: v})} />
            <TextInput placeholder="גיל" placeholderTextColor="#aaa" keyboardType="numeric" style={styles.darkInput} onChangeText={(v) => setUserData({...userData, age: v})} />
            <TextInput placeholder="גובה (ס״מ)" placeholderTextColor="#aaa" keyboardType="numeric" style={styles.darkInput} onChangeText={(v) => setUserData({...userData, height: v})} />
            <TextInput placeholder="איזה ספורט את/ה עושה?" placeholderTextColor="#aaa" style={styles.darkInput} onChangeText={(v) => setUserData({...userData, sportType: v})} />
            
            <Text style={styles.sectionLabel}>יכולות פיזיות:</Text>
            <TextInput placeholder="משקולות או בלי משקולות?" placeholderTextColor="#aaa" style={styles.darkInput} onChangeText={(v) => setUserData({...userData, hasWeights: v})} />
            <TextInput placeholder="כמה ק״ג את/ה מצליח/ה להרים?" placeholderTextColor="#aaa" keyboardType="numeric" style={styles.darkInput} onChangeText={(v) => setUserData({...userData, maxWeight: v})} />

            <Text style={styles.sectionLabel}>מה את/ה בדרך כלל אוכל/ת?</Text>
            <TextInput placeholder="רשימת מאכלים קבועה..." placeholderTextColor="#aaa" style={[styles.darkInput, styles.textArea]} multiline numberOfLines={5} onChangeText={(v) => setUserData({...userData, homeFoods: v})} />
            
            <Text style={styles.sectionLabel}>שאלון העדפות:</Text>
            <TextInput placeholder="מה את/ה הכי אוהב/ת?" placeholderTextColor="#aaa" style={styles.darkInput} onChangeText={(v) => setUserData({...userData, likes: v})} />
            <TextInput placeholder="מה ממש לא לשים בתפריט?" placeholderTextColor="#aaa" style={styles.darkInput} onChangeText={(v) => setUserData({...userData, dislikes: v})} />

            <TouchableOpacity style={styles.actionButton} onPress={handleLogin}>
              <Text style={styles.buttonText}>צור תוכנית מותאמת</Text>
            </TouchableOpacity>
          </ScrollView>
        </BlurView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

function ProfileScreen({ user, setUser, onLogout }) {
  const [tempData, setTempData] = useState({...user});

  const handleUpdate = async () => {
    setUser(tempData);
    await AsyncStorage.setItem('@user_data', JSON.stringify(tempData));
    Alert.alert("הצלחה", "הפרופיל עודכן בהצלחה!");
  };

  return (
    <View style={styles.container}>
      <BlurView intensity={100} tint="dark" style={styles.fullOverlay}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 40 }}>
          <Text style={styles.title}>עריכת פרופיל</Text>
          
          <Text style={styles.sectionLabel}>פרטים כלליים</Text>
          <TextInput value={tempData.name} placeholder="שם מלא" placeholderTextColor="#aaa" style={styles.darkInput} onChangeText={(v) => setTempData({...tempData, name: v})} />
          <TextInput value={tempData.weight} placeholder="משקל" placeholderTextColor="#aaa" keyboardType="numeric" style={styles.darkInput} onChangeText={(v) => setTempData({...tempData, weight: v})} />
          <TextInput value={tempData.weightDay} placeholder="יום שקילה שבועי" placeholderTextColor="#aaa" style={styles.darkInput} onChangeText={(v) => setTempData({...tempData, weightDay: v})} />
          <TextInput value={tempData.dailyCalories} placeholder="קלוריות ליום" placeholderTextColor="#aaa" keyboardType="numeric" style={styles.darkInput} onChangeText={(v) => setTempData({...tempData, dailyCalories: v})} />
          <TextInput value={tempData.age} placeholder="גיל" placeholderTextColor="#aaa" keyboardType="numeric" style={styles.darkInput} onChangeText={(v) => setTempData({...tempData, age: v})} />
          <TextInput value={tempData.height} placeholder="גובה" placeholderTextColor="#aaa" keyboardType="numeric" style={styles.darkInput} onChangeText={(v) => setTempData({...tempData, height: v})} />
          <TextInput value={tempData.sportType} placeholder="סוג ספורט" placeholderTextColor="#aaa" style={styles.darkInput} onChangeText={(v) => setTempData({...tempData, sportType: v})} />

          <Text style={styles.sectionLabel}>יכולות פיזיות</Text>
          <TextInput value={tempData.hasWeights} placeholder="משקולות?" placeholderTextColor="#aaa" style={styles.darkInput} onChangeText={(v) => setTempData({...tempData, hasWeights: v})} />
          <TextInput value={tempData.maxWeight} placeholder="משקל הרמה מקסימלי" placeholderTextColor="#aaa" keyboardType="numeric" style={styles.darkInput} onChangeText={(v) => setTempData({...tempData, maxWeight: v})} />

          <Text style={styles.sectionLabel}>תזונה והעדפות</Text>
          <TextInput value={tempData.homeFoods} placeholder="מאכלים בבית" placeholderTextColor="#aaa" style={[styles.darkInput, styles.textArea]} multiline onChangeText={(v) => setTempData({...tempData, homeFoods: v})} />
          <TextInput value={tempData.likes} placeholder="אוהב/ת" placeholderTextColor="#aaa" style={styles.darkInput} onChangeText={(v) => setTempData({...tempData, likes: v})} />
          <TextInput value={tempData.dislikes} placeholder="לא אוהב/ת" placeholderTextColor="#aaa" style={styles.darkInput} onChangeText={(v) => setTempData({...tempData, dislikes: v})} />
          
          <Text style={styles.sectionLabel}>היסטוריית משקל שבועי:</Text>
          {user.weightHistory?.map((h, i) => (
            <Text key={i} style={{color: '#aaa', textAlign: 'right'}}>{h.date}: {h.weight} ק"ג</Text>
          ))}

          <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#2ecc71', marginTop: 20 }]} onPress={handleUpdate}>
            <Text style={styles.buttonText}>עדכן פרטים</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#e74c3c', marginTop: 10 }]} onPress={onLogout}>
            <Text style={styles.buttonText}>התנתקות</Text>
          </TouchableOpacity>
        </ScrollView>
      </BlurView>
    </View>
  );
}

function HomeScreen({ stats, setStats, user, setUser }) {
  const [dailyTask, setDailyTask] = useState('מייצר תוכנית...');
  const [loading, setLoading] = useState(false);
  const [canPress, setCanPress] = useState(true);

  const days = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
  const todayIndex = new Date().getDay();
  const todayName = days[todayIndex];

  useEffect(() => {
    generatePlan();
    checkTimer();
    checkWeightDay();
  }, [user]);

  const checkWeightDay = async () => {
    if (todayName === user.weightDay) { 
      const lastWeightDate = await AsyncStorage.getItem('@last_weight_prompt');
      const todayStr = new Date().toLocaleDateString();
      if (lastWeightDate !== todayStr) {
        Alert.prompt(
          "שקילה שבועית",
          `מה המשקל שלך היום?`,
          [
            { text: "ביטול", style: "cancel" },
            { text: "אישור", onPress: (weight) => updateWeight(weight) }
          ],
          'plain-text'
        );
      }
    }
  };

  const updateWeight = async (newWeight) => {
    if(!newWeight) return;
    const newEntry = { date: new Date().toLocaleDateString(), weight: newWeight };
    const updatedUser = { ...user, weight: newWeight, weightHistory: [...(user.weightHistory || []), newEntry] };
    setUser(updatedUser);
    await AsyncStorage.setItem('@user_data', JSON.stringify(updatedUser));
    await AsyncStorage.setItem('@last_weight_prompt', new Date().toLocaleDateString());
  };

  const checkTimer = async () => {
    const lastPress = await AsyncStorage.getItem('@last_press');
    if (lastPress) {
      const diff = Date.now() - parseInt(lastPress);
      if (diff < 24 * 60 * 60 * 1000) setCanPress(false);
    }
  };

  const handleWorkoutDone = async () => {
    if (!canPress) return;
    
    setCanPress(false);
    const newStats = { ...stats, daysDone: stats.daysDone + 1 };
    setStats(newStats);
    await AsyncStorage.setItem('@last_press', Date.now().toString());
    await AsyncStorage.setItem('@stats', JSON.stringify(newStats));
  };

  const generatePlan = async () => {
    setLoading(true);
    const historyString = user.weightHistory?.map(h => `${h.date}: ${h.weight}`).join(", ");
    const prompt = `צור משימת כושר יומית ל${user.name}. יום: ${todayName}. קלוריות יעד: ${user.dailyCalories}. משקל נוכחי: ${user.weight}. היסטוריית משקל לניתוח השתפרות: ${historyString}. ציוד: ${user.hasWeights}. רמה: הדרגתית.`;
    const plan = await askGroq(prompt);
    setDailyTask(plan);
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Image source={{ uri: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48' }} style={styles.bgImage} />
      <BlurView intensity={70} tint="dark" style={styles.overlay}>
        <Text style={styles.greeting}>היי {user.name} 🔥</Text>
        
        <View style={styles.statRow}>
          <View style={[styles.miniCard, {width: '100%'}]}>
            <Text style={styles.statNumber}>{stats.daysDone}</Text>
            <Text style={styles.statLabel}>ימי התמדה</Text>
          </View>
        </View>

        <View style={[styles.taskCard, { flex: 1, marginBottom: 20 }]}>
          <Text style={styles.cardTitle}>משימת היום</Text>
          {loading ? <ActivityIndicator color="#00d2ff" /> : <ScrollView><Text style={styles.taskDesc}>{dailyTask}</Text></ScrollView>}
          <TouchableOpacity 
            style={[styles.actionButton, !canPress && { backgroundColor: '#555' }]} 
            onPress={handleWorkoutDone}
          >
            <Text style={styles.buttonText}>{canPress ? "עשיתי כושר באושר!" : "נתראה מחר!"}</Text>
          </TouchableOpacity>
        </View>
      </BlurView>
    </View>
  );
}

function NutritionScreen({ user }) {
  const [mealPlan, setMealPlan] = useState('לחץ לקבלת תפריט');
  const [loading, setLoading] = useState(false);

  const getNutrition = async () => {
    setLoading(true);
    const prompt = `צור תפריט יומי עבור ${user.name}. מגבלת קלוריות: ${user.dailyCalories}. 
    פרט כמויות ומשקלים מדויקים לכל מאכל. 
    זכור: לא יותר מפרי אחד בארוחה. 
    אוכל זמין: ${user.homeFoods}.`;
    
    const plan = await askGroq(prompt);
    setMealPlan(plan);
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <BlurView intensity={100} tint="dark" style={styles.fullOverlay}>
        <Text style={styles.title}>תפריט וכמויות (עד {user.dailyCalories} קלוריות)</Text>
        <ScrollView style={styles.foodCard}>
          {loading ? <ActivityIndicator color="#00d2ff" /> : <Text style={styles.foodItem}>{mealPlan}</Text>}
        </ScrollView>
        <TouchableOpacity style={styles.secondaryButton} onPress={getNutrition}>
          <Text style={styles.buttonText}>חשב תפריט עם כמויות 🥗</Text>
        </TouchableOpacity>
      </BlurView>
    </View>
  );
}

const Tab = createBottomTabNavigator();

export default function App() {
  const [isLogged, setIsLogged] = useState(false);
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({ daysDone: 0 });

  useEffect(() => {
    const loadData = async () => {
      const savedUser = await AsyncStorage.getItem('@user_data');
      const savedStats = await AsyncStorage.getItem('@stats');
      if (savedUser) { setUser(JSON.parse(savedUser)); setIsLogged(true); }
      if (savedStats) { setStats(JSON.parse(savedStats)); }
    };
    loadData();
  }, []);

  const handleLogout = async () => {
    Alert.alert(
      "התנתקות",
      "האם אתה בטוח שברצונך להתנתק ולמחוק את כל הנתונים?",
      [
        { text: "ביטול", style: "cancel" },
        { 
          text: "כן, התנתק", 
          onPress: async () => {
            await AsyncStorage.clear();
            setIsLogged(false);
            setUser(null);
            setStats({ daysDone: 0 });
          }
        }
      ]
    );
  };

  if (!isLogged) return <LoginScreen onLogin={(d) => {setUser(d); setIsLogged(true); AsyncStorage.setItem('@user_data', JSON.stringify(d));}} />;

  return (
    <NavigationContainer>
      <Tab.Navigator screenOptions={{ headerShown: false, tabBarStyle: { backgroundColor: '#000' }, tabBarActiveTintColor: '#00d2ff' }}>
        <Tab.Screen name="בית" children={() => <HomeScreen stats={stats} setStats={setStats} user={user} setUser={setUser} />} />
        <Tab.Screen name="תזונה" children={() => <NutritionScreen user={user} />} />
        <Tab.Screen name="פרופיל" children={() => <ProfileScreen user={user} setUser={setUser} onLogout={handleLogout} />} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  bgImage: { ...StyleSheet.absoluteFillObject },
  overlay: { flex: 1, paddingTop: 50, alignItems: 'center', paddingHorizontal: 20 },
  fullOverlay: { flex: 1, padding: 30 },
  greeting: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 20 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#00d2ff', marginBottom: 20, textAlign: 'center' },
  sectionLabel: { color: '#fff', fontSize: 16, marginTop: 10, textAlign: 'right', fontWeight: 'bold' },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 20 },
  miniCard: { width: '48%', height: 90, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  statNumber: { fontSize: 32, fontWeight: 'bold', color: '#00d2ff' },
  statLabel: { color: '#fff', fontSize: 12 },
  taskCard: { width: '100%', padding: 20, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 25 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginBottom: 10 },
  taskDesc: { color: '#ddd', fontSize: 16, textAlign: 'right', lineHeight: 22 },
  actionButton: { backgroundColor: '#00d2ff', padding: 15, borderRadius: 15, marginTop: 10 },
  secondaryButton: { backgroundColor: '#2ecc71', padding: 15, borderRadius: 15, marginTop: 15 },
  buttonText: { color: '#000', fontWeight: 'bold', textAlign: 'center' },
  darkInput: { backgroundColor: 'rgba(255,255,255,0.1)', padding: 12, borderRadius: 12, color: '#fff', textAlign: 'right', marginBottom: 10 },
  textArea: { height: 100, textAlignVertical: 'top' },
  foodCard: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20, padding: 15, flex: 1, marginBottom: 10 },
  foodItem: { color: '#fff', fontSize: 15, textAlign: 'right', lineHeight: 24 }
});