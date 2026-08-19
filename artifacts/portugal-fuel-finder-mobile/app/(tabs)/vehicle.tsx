import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

type Vehicle = { nickname:string; make:string; model:string; registration:string; fuel:string; tank:string; consumption:string };
const initial: Vehicle = { nickname:'', make:'', model:'', registration:'', fuel:'Diesel', tank:'50', consumption:'6.5' };

export default function VehicleScreen(){
 const [vehicle,setVehicle]=useState<Vehicle>(initial); const [saved,setSaved]=useState(false);
 useEffect(()=>{AsyncStorage.getItem('fuelfinder.vehicle').then(v=>{if(v){setVehicle(JSON.parse(v));setSaved(true)}})},[]);
 const update=(key:keyof Vehicle,value:string)=>{setSaved(false);setVehicle(v=>({...v,[key]:value}))};
 const save=async()=>{await AsyncStorage.setItem('fuelfinder.vehicle',JSON.stringify(vehicle));setSaved(true);Alert.alert('Veículo guardado','As recomendações podem agora usar os teus dados.');};
 return <SafeAreaView style={s.safe} edges={['top']}><ScrollView contentContainerStyle={s.content}>
  <Text style={s.title}>O meu veículo</Text><Text style={s.subtitle}>Personaliza a poupança com os dados reais do teu carro.</Text>
  <View style={s.lookup}><View style={s.lookupIcon}><Feather name="search" size={22} color="#152A46"/></View><View style={{flex:1}}><Text style={s.lookupTitle}>Adicionar pela matrícula</Text><Text style={s.lookupText}>Em breve: pesquisa automática dos dados técnicos em Portugal.</Text></View></View>
  <Text style={s.or}>OU ADICIONA MANUALMENTE</Text>
  <Field label="Nome do veículo" value={vehicle.nickname} onChangeText={v=>update('nickname',v)} placeholder="Ex.: Meu carro" />
  <View style={s.row}><View style={{flex:1}}><Field label="Marca" value={vehicle.make} onChangeText={v=>update('make',v)} placeholder="Renault" /></View><View style={{flex:1}}><Field label="Modelo" value={vehicle.model} onChangeText={v=>update('model',v)} placeholder="Captur" /></View></View>
  <Field label="Matrícula (opcional)" value={vehicle.registration} onChangeText={v=>update('registration',v.toUpperCase())} placeholder="AA-00-AA" autoCapitalize="characters" />
  <Text style={s.label}>Combustível</Text><View style={s.segment}>{['Diesel','Gasolina 95'].map(f=><Pressable key={f} onPress={()=>update('fuel',f)} style={[s.seg,vehicle.fuel===f&&s.active]}><Text style={[s.segText,vehicle.fuel===f&&s.activeText]}>{f}</Text></Pressable>)}</View>
  <View style={s.row}><View style={{flex:1}}><Field label="Depósito (L)" value={vehicle.tank} onChangeText={v=>update('tank',v)} keyboardType="decimal-pad" /></View><View style={{flex:1}}><Field label="Consumo (L/100 km)" value={vehicle.consumption} onChangeText={v=>update('consumption',v)} keyboardType="decimal-pad" /></View></View>
  <Pressable style={s.button} onPress={save}><Feather name={saved?'check':'save'} size={18} color="#152A46"/><Text style={s.buttonText}>{saved?'Guardado':'Guardar veículo'}</Text></Pressable>
  <Text style={s.note}>A matrícula fica guardada apenas no dispositivo nesta versão. Não pesquisamos dados do proprietário.</Text>
 </ScrollView></SafeAreaView>
}
function Field(props:any){return <View style={{gap:7}}><Text style={s.label}>{props.label}</Text><TextInput {...props} style={s.input} placeholderTextColor="#8A98A6" /></View>}
const s=StyleSheet.create({safe:{flex:1,backgroundColor:'#F1F7F8'},content:{padding:20,paddingBottom:110,gap:16},title:{fontFamily:'Inter_700Bold',fontSize:29,color:'#152A46'},subtitle:{fontFamily:'Inter_400Regular',fontSize:14,color:'#607083',lineHeight:20},lookup:{flexDirection:'row',gap:13,alignItems:'center',backgroundColor:'#fff',borderWidth:1,borderColor:'#CBDCDD',padding:16,borderRadius:16},lookupIcon:{width:46,height:46,borderRadius:14,backgroundColor:'#B8E63D',alignItems:'center',justifyContent:'center'},lookupTitle:{fontFamily:'Inter_700Bold',fontSize:16,color:'#152A46'},lookupText:{fontFamily:'Inter_400Regular',fontSize:12,color:'#607083',marginTop:3,lineHeight:17},or:{fontFamily:'Inter_700Bold',fontSize:11,color:'#7A8997',letterSpacing:1,textAlign:'center',marginVertical:2},label:{fontFamily:'Inter_600SemiBold',fontSize:12,color:'#33475C'},input:{height:49,backgroundColor:'#fff',borderWidth:1,borderColor:'#B9D0D2',borderRadius:13,paddingHorizontal:14,fontFamily:'Inter_500Medium',color:'#152A46'},row:{flexDirection:'row',gap:12},segment:{flexDirection:'row',backgroundColor:'#DCEDEF',padding:4,borderRadius:14},seg:{flex:1,padding:11,alignItems:'center',borderRadius:11},active:{backgroundColor:'#152A46'},segText:{fontFamily:'Inter_600SemiBold',color:'#607083'},activeText:{color:'#E8F8A7'},button:{height:52,backgroundColor:'#B8E63D',borderRadius:14,flexDirection:'row',gap:8,alignItems:'center',justifyContent:'center',marginTop:4},buttonText:{fontFamily:'Inter_700Bold',color:'#152A46'},note:{fontFamily:'Inter_400Regular',fontSize:11,lineHeight:16,color:'#607083',textAlign:'center'}});
