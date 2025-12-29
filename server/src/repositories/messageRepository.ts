
import { AppDataSource } from '../database/connection';
import { MessageEntity } from '@entity/messageEntity';
import { Repository } from 'typeorm';
import { NotFoundError } from '@models/errors/NotFoundError';

/**
 * Message Repository
 * Handles database operations for messages
 */
class MessageRepository {
	private readonly repository: Repository<MessageEntity>;

	constructor() {
		this.repository = AppDataSource.getRepository(MessageEntity);
	}

	/**
	 * Get all messages for a specific report
	 * @param reportId - The ID of the report
	 * @returns Array of messages with sender information
	 */
	async getMessagesByReportId(reportId: number): Promise<MessageEntity[]> {
		return this.repository.find({
			where: { reportId },
			relations: ['sender', 'sender.userRoles', 'sender.userRoles.departmentRole', 'sender.userRoles.departmentRole.role'],
			order: { createdAt: 'ASC' }
		});
	}

	/**
	 * Create a new message for a report
	 * @param reportId - The ID of the report
	 * @param senderId - The ID of the sender
	 * @param content - The message text content
	 * @returns The created message with sender information
	 */
	async createMessage(reportId: number, senderId: number, content: string): Promise<MessageEntity> {
		const message = this.repository.create({
			reportId,
			senderId,
			content
		});
		const savedMessage = await this.repository.save(message);
		// Fetch the complete message with relations
		const completeMessage = await this.repository.findOne({
			where: { id: savedMessage.id },
			relations: ['sender', 'sender.userRoles', 'sender.userRoles.departmentRole', 'sender.userRoles.departmentRole.role']
		});
		if (!completeMessage) {
			throw new Error('Failed to retrieve created message');
		}
		return completeMessage;
	}


}

export const messageRepository = new MessageRepository();
