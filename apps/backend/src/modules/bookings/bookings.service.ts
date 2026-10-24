import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { RsvpStatus } from '../../generated/prisma/enums.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { EventsService } from '../events/events.service.js';

@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsService: EventsService,
  ) {}

  async findAllForUser(userId?: string) {
    if (!userId) {
      return [];
    }

    return this.prisma.eventBooking.findMany({
      where: { userId },
      include: { event: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createBooking(eventId: string, userId?: string) {
    if (!eventId) {
      throw new BadRequestException('eventId zorunludur.');
    }
    return this.eventsService.bookEvent(eventId, userId);
  }

  async cancelBooking(bookingId: string, userId?: string) {
    const existing = await this.prisma.eventBooking.findUnique({
      where: { id: bookingId },
    });

    if (!existing || (userId && existing.userId !== userId)) {
      throw new NotFoundException('Rezervasyon bulunamadı.');
    }

    return this.prisma.eventBooking.update({
      where: { id: bookingId },
      data: { rsvpStatus: RsvpStatus.CANCELLED },
    });
  }
}
