import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ModelService } from '../../core/services/model.service';

@Component({
  selector: 'app-model',
  imports: [],
  templateUrl: './model.component.html',
  styleUrl: './model.component.scss',
})
export class ModelComponent implements OnInit {
  constructor(
    private readonly modelService: ModelService,
    private readonly fb: FormBuilder
  ) {
    // โมเดลรับค่า 3 ตัว (columns=['IsHoliday', 'Duration_Days', 'Flavor_Encoded'])
    this.predictForm = this.fb.group({
      val1: [0],
      val2: [7],
      val3: [11],
    });
  }

  ngOnInit(): void {
    this.onSubmit();
  }


  predictForm: FormGroup;
  result: any = null;

  onSubmit() {
    // ดึงค่าจากฟอร์มมาใส่ใน Array ตามลำดับที่ Python ต้องการ
    const formData = [
      this.predictForm.value.val1,
      this.predictForm.value.val2,
      this.predictForm.value.val3,
    ];

    this.modelService.getPrediction(formData).subscribe({
      next: (res) => {
        this.result = res.prediction;
        console.log('Prediction:', res);
      },
      error: (err) => console.error('Error:', err),
    });
  }
}
