
//  turn on one of these lines below depending on whether using
//  audio, photodiode, or ble to trigger pump:
//      ledStatePump = ledStateAudio;
//      ledStatePump = ledStatePhoto;
//      ledStatePump = ledStateBLE;

int led0_green = 13; //green led, tied to pump
int led1_pumptrigger = 10; //pump
int led2_yellow = 9; //yellow led, photo or ble status
int led3_red_power = 8; //red led, arduino power
int blePin = 7; //digital input from ble nano
int ledStatePump = LOW;
int ledStateAudio = LOW;
int ledStatePhoto = LOW;
int ledStateBLE = LOW;
int turnpumpoff=0;

// the setup routine runs once when you press reset:
void setup() {
  // initialize serial communication at 9600 bits per second:
  Serial.begin(115200);
  pinMode(led0_green, OUTPUT); //green
  pinMode(led1_pumptrigger, OUTPUT); //pump
  pinMode(led2_yellow, OUTPUT); //yellow
  pinMode(led3_red_power, OUTPUT); //red
  
  pinMode(blePin, INPUT); //digital input from ble nano
  
  digitalWrite(led3_red_power,HIGH); //turn red led on for power
  digitalWrite(led0_green,LOW); //turn green led off
  digitalWrite(led2_yellow,LOW); //turn yellow led off
  digitalWrite(led1_pumptrigger,LOW); //turn pump off
}

void loop(){
  int audioInput = analogRead(A0);
  int photoInput = analogRead(A3);
  int bleInput = digitalRead(blePin); 
  Serial.println(String(photoInput) + " "
    + String(audioInput) + " " 
    + String(bleInput) + " "
    + String(micros()));
//  Serial.println();
  
  //Handles audio line
  if (audioInput > 20 && ledStateAudio == HIGH)
  {
  }
  else if (audioInput > 20 && ledStateAudio == LOW)
  {
     ledStateAudio = HIGH;
  }
  else if (ledStateAudio == HIGH)
  {
    ledStateAudio = LOW;
  }
    
    //Handles ble line
   if (bleInput == HIGH)
   {
    ledStateBLE = HIGH;
   }
   else if (bleInput == LOW)
   {
    ledStateBLE = LOW;
   } 
   
  // Handles photodiode line  
  if (photoInput > 500 && ledStatePhoto == LOW)
  {
     ledStatePhoto = HIGH;
  }
  else if (photoInput > 425 && ledStatePhoto == HIGH)
  {
  }
  else if (photoInput < 425 && ledStatePhoto == HIGH)
  {
    turnpumpoff=turnpumpoff+1;
    if (turnpumpoff >= 1){
      ledStatePhoto = LOW;
      Serial.println("turned pump off");
      turnpumpoff=0;
    }
  }
  
//  ledStatePump = ledStateAudio;
//  ledStatePump = ledStatePhoto;
//  digitalWrite(led2_yellow,ledStatePhoto);
  ledStatePump = ledStateBLE;

  digitalWrite(led1_pumptrigger,ledStatePump); //trigger pump
  digitalWrite(led0_green,ledStatePump); //green led (pump)
  delay(5);
}
