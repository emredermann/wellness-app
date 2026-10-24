import { IsOptional, IsUUID } from 'class-validator';

export class BookEventDto {
  @IsOptional()
  @IsUUID('4', { message: 'Geçerli bir kullanıcı UUID değeri giriniz.' })
  userId?: string;
}
