import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query } from '@nestjs/common';
import { FilterRecipesQueryDto } from './dto/filter-recipes.query.dto.js';
import { PhotoAnalyzeDto } from './dto/photo-analyze.dto.js';
import { RecipesService } from './recipes.service.js';

@Controller(['v1/recipes', 'recipes'])
export class RecipesController {
  constructor(private readonly service: RecipesService) {}

  @Get()
  findAll(@Query() query: FilterRecipesQueryDto) {
    return this.service.findAll(query);
  }

  @Post('photo-analyze-mock')
  @HttpCode(HttpStatus.OK)
  analyzePhotoMock(@Body() dto: PhotoAnalyzeDto) {
    return this.service.analyzeMealPhoto(dto);
  }
}
