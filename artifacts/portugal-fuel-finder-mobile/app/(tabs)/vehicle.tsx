import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

type Vehicle = {
  nickname: string;
  make: string;
  model: string;
  registration: string;
  fuel: 'Diesel' | 'Gasolina 95';
  tank: string;
  consumption: string;
};

const VEHICLE_KEY = 'fuelfinder.vehicle';
const initial: Vehicle = { nickname:'', make:'', model:'', registration:'', fuel:'Diesel', tank:'50', consumption:'6.5' };

export default function VehicleScreen(){
 const [vehicle,setVehicle]=useState<Vehicle>(initial);
 const [saved,setSaved]=useState(false);
 const [lookupRegistration,setLookupRegistration]=useState('');

 useEffect(()=>{
   AsyncStorage.getItem(VEHICLE_KEY).then(value=>{
     if(value){
       try { setVehicle(JSON.parse(value)); setSaved(true); } catch { /* ignore invalid local data */ }
     }
   });
 },[]);

 const tank = Number.parseFloat(vehicle.tank);
 const consumption = Number.parseFloat(vehicle.consumption);
 const valid = useMemo(() => Number.isFinite(tank) && tank > 0 && Number.isFinite(consumption) && consumption > 0, [tank, consumption]);
 const update=(key:keyof Vehicle,value:string)=>{setSaved(false);setVehicle(v=>({...v,[key]:value}))};

 const save=async()=>{
   if(!valid){
     Alert.alert('Verifica os dados','O depósito e o consumo têm de ser números superiores a zero.');
     return;
   }
   await AsyncStorage.setItem(VEHICLE_KEY,JSON.stringify(vehicle));
   setSaved(true);
   Alert.alert('Veículo guardado','A página Início vai agora usar estes dados para calcular a tua poupança real.');
 };

 const remove=()=>{
   Alert.alert('Remover veículo','Queres apagar o veículo guardado?',[
     {text:'Cancelar',style:'cancel'},
     {text:'Remover',style:'destructive',onPress:async()=>{await AsyncStorage.removeItem(VEHICLE_KEY);setVehicle(initial);setSaved(false);}}
   ]);
 };

 const lookup=()=>{
   if(!lookupRegistration.trim()){
     Alert.alert('Introduz a matrícula','Escreve a matrícula do veículo antes de pesquisar.');
     return;
   }
   Alert.alert('Pesquisa por matrícula','O ecrã está pronto. Vamos ligar o fornecedor de dados português assim que escolhermos a API final. Podes adicionar o veículo manualmente entretanto.');
 };

 return <SafeAreaView style={s.safe} edges={['top']}><ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
  <Text style={s.title}>O meu veículo</Text><Text style={s.subtitle}>Personaliza a poupança com os dados reais do teu carro.</Text>

  <View style={s.lookupCard}>
    <View style={s.lookupHeader}>
      <View style={s.lookupIcon}><Feather name="search" size={22} color="#152A46"/></View>
      <View style={{flex:1}}><Text style={s.lookupTitle}>Adicionar pela matrícula</Text><Text style={s.lookupText}>Portugal primeiro. A pesquisa automática será ligada ao nosso backend.</Text></View>
    </View>
    <View style={s.lookupRow}>
      <TextInput value={lookupRegistration} onChangeText={v=>setLookupRegistration(v.toUpperCase())} autoCapitalize="characters" placeholder="AA-00-AA" placeholderTextColor="#8A98A6" style={[s.input,{flex:1}]} />
      <Pressable style={s.lookupButton} onPress={lookup}><Text style={s.lookupButtonText}>Pesquisar</Text></Pressable>
    </View>
  </View>

  <Text style={s.or}>OU ADICIONA MANUALMENTE</Text>
  <Field label="Nome do veículo" value={vehicle.nickname} onChangeText={(v:string)=>update('nickname',v)} placeholder="Ex.: Meu carro" />
  <View style={s.row}><View style={{flex:1}}><Field label="Marca" value={vehicle.make} onChangeText={(v:string)=>update('make',v)} placeholder="Renault" /></View><View style={{flex:1}}><Field label="Modelo" value={vehicle.model} onChangeText={(v:string)=>update('model',v)} placeholder="Captur" /></View></View>
  <Field label="Matrícula (opcional)" value={vehicle.registration} onChangeText={(v:string)=>update('registration',v.toUpperCase())} placeholder="AA-00-AA" autoCapitalize="characters" />

  <Text style={s.label}>Combustível</Text><View style={s.segment}>{(['Diesel','Gasolina 95'] as const).map(f=><Pressable key={f} onPress={()=>update('fuel',f)} style={[s.seg,vehicle.fuel===f&&s.active]}><Text style={[s.segText,vehicle.fuel===f&&s.activeText]}>{f}</Text></Pressable>)}</View>
  <View style={s.row}><View style={{flex:1}}><Field label="Depósito (L)" value={vehicle.tank} onChangeText={(v:string)=>update('tank',v.replace(',','.'))} keyboardType="decimal-pad" /></View><View style={{flex:1}}><Field label="Consumo (L/100 km)" value={vehicle.consumption} onChangeText={(v:string)=>update('consumption',v.replace(',','.'))} keyboardType="decimal-pad" /></View></View>

  <View style={s.preview}>
    <Feather name="zap" size={18} color="#58821D" />
    <View style={{flex:1}}><Text style={s.previewTitle}>Como isto melhora o FuelFinder</Text><Text style={s.previewText}>Usamos o tamanho do depósito e o consumo para descontar o custo da viagem e mostrar a poupança real.</Text></View>
  </View>

  <Pressable style={[s.button,!valid&&s.buttonDisabled]} onPress={save}><Feather name={saved?'check':'save'} size={18} color="#152A46"/><Text style={s.buttonText}>{saved?'Guardado':'Guardar veículo'}</Text></Pressable>
  {saved && <Pressable style={s.removeButton} onPress={remove}><Feather name="trash-2" size={16} color="#9B2C2C"/><Text style={s.removeText}>Remover veículo</Text></Pressable>}
  <Text style={s.note}>A matrícula e os dados manuais ficam guardados apenas neste dispositivo nesta versão. Não pesquisamos nem guardamos dados do proprietário.</Text>
 </ScrollView></SafeAreaView>
}

function Field(props:any){return <View style={{gap:7}}><Text style={s.label}>{props.label}</Text><TextInput {...props} style={s.input} placeholderTextColor="#8A98A6" /></View>}

const s=StyleSheet.create({
 safe:{flex:1,backgroundColor:'#F1F7F8'},content:{padding:20,paddingBottom:110,gap:16},title:{fontFamily:'Inter_700Bold',fontSize:29,color:'#152A46'},subtitle:{fontFamily:'Inter_400Regular',fontSize:14,color:'#607083',lineHeight:20},lookupCard:{backgroundColor:'#fff',borderWidth:1,borderColor:'#CBDCDD',padding:16,borderRadius:16,gap:14},lookupHeader:{flexDirection:'row',gap:13,alignItems:'center'},lookupIcon:{width:46,height:46,borderRadius:14,backgroundColor:'#B8E63D',alignItems:'center',justifyContent:'center'},lookupTitle:{fontFamily:'Inter_700Bold',fontSize:16,color:'#152A46'},lookupText:{fontFamily:'Inter_400Regular',fontSize:12,color:'#607083',marginTop:3,lineHeight:17},lookupRow:{flexDirection:'row',gap:9},lookupButton:{paddingHorizontal:16,borderRadius:13,backgroundColor:'#152A46',alignItems:'center',justifyContent:'center'},lookupButtonText:{fontFamily:'Inter_700Bold',fontSize:12,color:'#E8F8A7'},or:{fontFamily:'Inter_700Bold',fontSize:11,color:'#7A8997',letterSpacing:1,textAlign:'center',marginVertical:2},label:{fontFamily:'Inter_600SemiBold',fontSize:12,color:'#33475C'},input:{height:49,backgroundColor:'#fff',borderWidth:1,borderColor:'#B9D0D2',borderRadius:13,paddingHorizontal:14,fontFamily:'Inter_500Medium',color:'#152A46'},row:{flexDirection:'row',gap:12},segment:{flexDirection:'row',backgroundColor:'#DCEDEF',padding:4,borderRadius:14},seg:{flex:1,padding:11,alignItems:'center',borderRadius:11},active:{backgroundColor:'#152A46'},segText:{fontFamily:'Inter_600SemiBold',color:'#607083'},activeText:{color:'#E8F8A7'},preview:{flexDirection:'row',gap:10,backgroundColor:'#ECF8D4',padding:14,borderRadius:14},previewTitle:{fontFamily:'Inter_700Bold',fontSize:13,color:'#33475C'},previewText:{fontFamily:'Inter_400Regular',fontSize:11,color:'#607083',lineHeight:16,marginTop:3},button:{height:52,backgroundColor:'#B8E63D',borderRadius:14,flexDirection:'row',gap:8,alignItems:'center',justifyContent:'center',marginTop:4},buttonDisabled:{opacity:0.55},buttonText:{fontFamily:'Inter_700Bold',color:'#152A46'},removeButton:{height:46,borderRadius:13,borderWidth:1,borderColor:'#E2B8B8',flexDirection:'row',gap:8,alignItems:'center',justifyContent:'center'},removeText:{fontFamily:'Inter_600SemiBold',color:'#9B2C2C'},note:{fontFamily:'Inter_400Regular',fontSize:11,lineHeight:16,color:'#607083',textAlign:'center'}
});
