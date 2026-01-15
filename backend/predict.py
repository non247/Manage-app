# predict.py
import sys
import json
import joblib
import numpy as np
import pandas as pd

# 1. โหลดโมเดลที่ train ไว้
model = joblib.load('model.pkl')

def main():
    # 2. อ่านข้อมูลที่ส่งมาจาก Node.js (stdin)
    lines = sys.stdin.readlines()
    data = json.loads(lines[0])
    
    # 3. เตรียมข้อมูล (ตัวอย่างเช่นแปลงเป็น 2D array)
    input_data = np.array(data).reshape(1, -1)
    
    # 4. ทำนายผล
    prediction = model.predict(input_data)
    
    # 5. ส่งผลลัพธ์กลับไปยัง Node.js ผ่านการ print (stdout)
    print(json.dumps(prediction.tolist()))

if __name__ == '__main__':
    main()